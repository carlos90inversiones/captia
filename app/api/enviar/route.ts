import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generarEmailOutreach } from '@/lib/gemini'
import { Resend } from 'resend'

const H = { 'Content-Type': 'application/json' }

export async function POST(req: NextRequest) {
  try {
    const { negocio_id, contacto_ids } = await req.json()
    if (!negocio_id) return new Response(JSON.stringify({ error: 'negocio_id requerido' }), { status: 400, headers: H })

    const db = getSupabaseAdmin()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Cargamos el negocio
    const { data: negocio } = await db.from('captia_negocios').select('*').eq('id', negocio_id).single()
    if (!negocio) return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404, headers: H })

    // Si se pasan IDs concretos usamos esos, si no los nuevos sin email enviado
    let query = db.from('captia_contactos').select('*').eq('negocio_id', negocio_id)
    if (contacto_ids?.length) {
      query = query.in('id', contacto_ids)
    } else {
      query = query.eq('estado', 'nuevo').not('email_encontrado', 'is', null)
    }

    const { data: contactos } = await query.limit(10) // máx 10 por llamada
    if (!contactos?.length) {
      return new Response(JSON.stringify({ enviados: 0, mensaje: 'No hay contactos con email para enviar' }), { status: 200, headers: H })
    }

    let enviados = 0
    for (const contacto of contactos) {
      try {
        // Generamos el email con Gemini
        const email = await generarEmailOutreach({
          negocioOrigen: negocio.nombre,
          sectorOrigen: negocio.sector,
          descripcionOrigen: negocio.descripcion,
          nombreDestino: contacto.nombre,
          sectorDestino: contacto.sector || '',
          ciudadDestino: contacto.ciudad || '',
          tono: negocio.tono,
        })

        // Enviamos con Resend
        await resend.emails.send({
          from: `${negocio.nombre} <captia@marsof.es>`,
          to: contacto.email_encontrado!,
          replyTo: negocio.email,
          subject: email.asunto,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">
            ${email.cuerpo.replace(/\n/g, '<br/>')}
          </div>`,
        })

        // Registramos el envío
        await db.from('captia_envios').insert({
          contacto_id: contacto.id,
          negocio_id,
          paso: 1,
          asunto: email.asunto,
          cuerpo: email.cuerpo,
        })

        // Actualizamos estado del contacto
        await db.from('captia_contactos').update({
          estado: 'email_enviado',
          ultimo_contacto: new Date().toISOString(),
        }).eq('id', contacto.id)

        enviados++
      } catch (err) {
        console.error(`[enviar] error con contacto ${contacto.id}:`, err)
      }
    }

    return new Response(JSON.stringify({ enviados }), { status: 200, headers: H })
  } catch (err) {
    console.error('[enviar POST]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: H })
  }
}
