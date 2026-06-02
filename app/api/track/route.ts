import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GIF transparente 1x1 (base64)
const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')

  // Registrar apertura: actualizar estado del contacto si aún no ha respondido
  if (cid) {
    try {
      const db = getSupabaseAdmin()
      await db
        .from('captia_contactos')
        .update({ estado: 'abierto' })
        .eq('id', cid)
        .in('estado', ['email_enviado', 'seguimiento_1', 'seguimiento_2'])
    } catch {
      // No interrumpir la respuesta del pixel si falla la DB
    }
  }

  return new Response(GIF_1x1, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(GIF_1x1.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    },
  })
}
