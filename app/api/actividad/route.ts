import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const H = { 'Content-Type': 'application/json' }

// GET /api/actividad?negocio_id=xxx&since=ISO_TIMESTAMP
// Returns contacts that opened/responded AFTER the `since` timestamp
export async function GET(req: NextRequest) {
  const negocio_id = req.nextUrl.searchParams.get('negocio_id')
  const since = req.nextUrl.searchParams.get('since')

  if (!negocio_id) return new Response(JSON.stringify({ error: 'negocio_id requerido' }), { status: 400, headers: H })

  const db = getSupabaseAdmin()

  let query = db
    .from('captia_contactos')
    .select('id, nombre, estado, telefono, ultimo_contacto')
    .eq('negocio_id', negocio_id)
    .in('estado', ['abierto', 'respondio'])
    .order('ultimo_contacto', { ascending: false })
    .limit(20)

  if (since) {
    query = query.gt('ultimo_contacto', since)
  }

  const { data: actividad } = await query

  return new Response(JSON.stringify({ actividad: actividad || [] }), { status: 200, headers: H })
}
