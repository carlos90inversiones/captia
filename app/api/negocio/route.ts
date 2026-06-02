import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const H = { 'Content-Type': 'application/json' }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, sector, descripcion, ciudad, cliente_ideal, tono, email, telefono } = body

    if (!nombre || !sector || !descripcion || !ciudad || !cliente_ideal || !email) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400, headers: H })
    }

    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('captia_negocios')
      .insert({ nombre, sector, descripcion, ciudad, cliente_ideal, tono, email, telefono })
      .select('id')
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ id: data.id }), { status: 201, headers: H })
  } catch (err) {
    console.error('[negocio POST]', err)
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers: H })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, nombre, sector, descripcion, ciudad, cliente_ideal, tono, email, telefono } = body
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: H })

    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('captia_negocios')
      .update({ nombre, sector, descripcion, ciudad, cliente_ideal, tono, email, telefono })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers: H })
  } catch (err) {
    console.error('[negocio PATCH]', err)
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers: H })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: H })

  const db = getSupabaseAdmin()
  const { data, error } = await db.from('captia_negocios').select('*').eq('id', id).single()
  if (error) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404, headers: H })
  return new Response(JSON.stringify(data), { status: 200, headers: H })
}
