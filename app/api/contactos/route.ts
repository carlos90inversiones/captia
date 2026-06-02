import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const H = { 'Content-Type': 'application/json' }

export async function GET(req: NextRequest) {
  const negocioId = req.nextUrl.searchParams.get('negocio_id')
  if (!negocioId) return new Response(JSON.stringify({ error: 'negocio_id requerido' }), { status: 400, headers: H })

  const db = getSupabaseAdmin()
  const { data: contactos } = await db
    .from('captia_contactos')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('created_at', { ascending: false })

  return new Response(JSON.stringify({ contactos: contactos || [] }), { status: 200, headers: H })
}

export async function PATCH(req: NextRequest) {
  const { id, estado } = await req.json()
  if (!id || !estado) return new Response(JSON.stringify({ error: 'id y estado requeridos' }), { status: 400, headers: H })

  const db = getSupabaseAdmin()
  await db.from('captia_contactos').update({ estado }).eq('id', id)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: H })
}
