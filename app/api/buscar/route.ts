import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { buscarNegociosEnGoogleMaps } from '@/lib/google-places'
import { generarEmailOutreach } from '@/lib/gemini'

const H = { 'Content-Type': 'application/json' }

export async function POST(req: NextRequest) {
  try {
    const { negocio_id } = await req.json()
    if (!negocio_id) return new Response(JSON.stringify({ error: 'negocio_id requerido' }), { status: 400, headers: H })

    const db = getSupabaseAdmin()

    // Cargamos el perfil del negocio
    const { data: negocio, error: negErr } = await db
      .from('captia_negocios').select('*').eq('id', negocio_id).single()
    if (negErr || !negocio) return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404, headers: H })

    // Buscamos en Google Maps negocios que puedan ser clientes potenciales
    const encontrados = await buscarNegociosEnGoogleMaps({
      sector: negocio.cliente_ideal,
      ciudad: negocio.ciudad,
      radio: 15000, // 15km
      maxResultados: 20,
    })

    let nuevos = 0
    const contactosInsertados = []

    for (const lugar of encontrados) {
      // Evitamos duplicados por place_id
      const { data: existe } = await db
        .from('captia_contactos').select('id').eq('place_id', lugar.place_id).maybeSingle()
      if (existe) continue

      // Intentamos generar email de outreach con Gemini
      let emailGenerado = null
      if (lugar.web || lugar.telefono) {
        try {
          emailGenerado = await generarEmailOutreach({
            negocioOrigen: negocio.nombre,
            sectorOrigen: negocio.sector,
            descripcionOrigen: negocio.descripcion,
            nombreDestino: lugar.nombre,
            sectorDestino: lugar.sector,
            ciudadDestino: lugar.ciudad,
            tono: negocio.tono,
          })
        } catch { /* Continuamos aunque falle Gemini */ }
      }

      const { data: contacto } = await db
        .from('captia_contactos')
        .insert({
          negocio_id,
          place_id: lugar.place_id,
          nombre: lugar.nombre,
          direccion: lugar.direccion,
          ciudad: lugar.ciudad,
          telefono: lugar.telefono,
          web: lugar.web,
          rating: lugar.rating,
          sector: lugar.sector,
          email_encontrado: lugar.email_encontrado,
          estado: 'nuevo',
        })
        .select('id')
        .single()

      if (contacto) {
        nuevos++
        contactosInsertados.push({ ...contacto, emailGenerado })
      }
    }

    return new Response(JSON.stringify({
      encontrados: encontrados.length,
      nuevos,
      contactos: contactosInsertados,
    }), { status: 200, headers: H })

  } catch (err) {
    console.error('[buscar POST]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: H })
  }
}
