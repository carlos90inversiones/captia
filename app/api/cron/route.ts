import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generarEmailOutreach } from '@/lib/gemini'
import { buscarNegociosEnGoogleMaps } from '@/lib/google-places'
import { Resend } from 'resend'

const H = { 'Content-Type': 'application/json' }

// Cron diario: busca nuevos contactos + envía seguimientos pendientes
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: H })
  }

  const db = getSupabaseAdmin()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: negocios } = await db.from('captia_negocios').select('*').eq('activo', true)
  if (!negocios?.length) return new Response(JSON.stringify({ ok: true, negocios: 0 }), { status: 200, headers: H })

  let totalBuscados = 0
  let totalSeguimientos = 0

  for (const negocio of negocios) {
    try {
      // 1. Buscar nuevos contactos en Google Maps
      const encontrados = await buscarNegociosEnGoogleMaps({
        sector: negocio.cliente_ideal,
        ciudad: negocio.ciudad,
        radio: 15000,
        maxResultados: 10,
      })

      for (const lugar of encontrados) {
        const { data: existe } = await db.from('captia_contactos').select('id').eq('place_id', lugar.place_id).maybeSingle()
        if (existe) continue
        await db.from('captia_contactos').insert({
          negocio_id: negocio.id, place_id: lugar.place_id,
          nombre: lugar.nombre, direccion: lugar.direccion, ciudad: lugar.ciudad,
          telefono: lugar.telefono, web: lugar.web, rating: lugar.rating, sector: lugar.sector,
        })
        totalBuscados++
      }

      // 2. Seguimiento 1 — contactos a los que se mandó email hace 4+ días sin respuesta
      const hace4dias = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      const { data: paraseguimiento1 } = await db.from('captia_contactos').select('*')
        .eq('negocio_id', negocio.id).eq('estado', 'email_enviado')
        .lt('ultimo_contacto', hace4dias).not('email_encontrado', 'is', null).limit(5)

      for (const contacto of (paraseguimiento1 || [])) {
        try {
          const email = await generarEmailOutreach({
            negocioOrigen: negocio.nombre, sectorOrigen: negocio.sector,
            descripcionOrigen: `Seguimiento — ${negocio.descripcion}`,
            nombreDestino: contacto.nombre, sectorDestino: contacto.sector || '',
            ciudadDestino: contacto.ciudad || '', tono: negocio.tono,
          })
          await resend.emails.send({
            from: `${negocio.nombre} <captia@marsof.es>`,
            to: contacto.email_encontrado!,
            replyTo: negocio.email,
            subject: `Re: ${email.asunto}`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; color: #222;">${email.cuerpo.replace(/\n/g, '<br/>')}</div>`,
          })
          await db.from('captia_envios').insert({ contacto_id: contacto.id, negocio_id: negocio.id, paso: 2, asunto: email.asunto, cuerpo: email.cuerpo })
          await db.from('captia_contactos').update({ estado: 'seguimiento_1', ultimo_contacto: new Date().toISOString() }).eq('id', contacto.id)
          totalSeguimientos++
        } catch { /* continúa */ }
      }

      // 3. Seguimiento 2 — contactos en seguimiento_1 hace 7+ días sin respuesta
      const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: paraseguimiento2 } = await db.from('captia_contactos').select('*')
        .eq('negocio_id', negocio.id).eq('estado', 'seguimiento_1')
        .lt('ultimo_contacto', hace7dias).not('email_encontrado', 'is', null).limit(5)

      for (const contacto of (paraseguimiento2 || [])) {
        try {
          const email = await generarEmailOutreach({
            negocioOrigen: negocio.nombre, sectorOrigen: negocio.sector,
            descripcionOrigen: `Último intento — ${negocio.descripcion}`,
            nombreDestino: contacto.nombre, sectorDestino: contacto.sector || '',
            ciudadDestino: contacto.ciudad || '', tono: negocio.tono,
          })
          await resend.emails.send({
            from: `${negocio.nombre} <captia@marsof.es>`,
            to: contacto.email_encontrado!, replyTo: negocio.email,
            subject: email.asunto,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; color: #222;">${email.cuerpo.replace(/\n/g, '<br/>')}</div>`,
          })
          await db.from('captia_envios').insert({ contacto_id: contacto.id, negocio_id: negocio.id, paso: 3, asunto: email.asunto, cuerpo: email.cuerpo })
          await db.from('captia_contactos').update({ estado: 'seguimiento_2', ultimo_contacto: new Date().toISOString() }).eq('id', contacto.id)
          totalSeguimientos++
        } catch { /* continúa */ }
      }

    } catch (err) {
      console.error(`[cron] error negocio ${negocio.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ ok: true, buscados: totalBuscados, seguimientos: totalSeguimientos }), { status: 200, headers: H })
}
