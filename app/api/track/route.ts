import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GIF transparente 1x1 (base64)
const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

async function notificarWhatsApp(telefono: string, mensaje: string) {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY
    if (!apiKey || !telefono) return
    const num = telefono.replace(/\D/g, '').replace(/^0034/, '34').replace(/^34(?=\d{9}$)/, '34')
    const url = `https://api.callmebot.com/whatsapp.php?phone=${num}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`
    await fetch(url, { signal: AbortSignal.timeout(5000) })
  } catch { /* no bloquear si falla */ }
}

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')

  // Registrar apertura: actualizar estado del contacto si aún no ha respondido
  if (cid) {
    try {
      const db = getSupabaseAdmin()
      const { data: updated } = await db
        .from('captia_contactos')
        .update({ estado: 'abierto', ultimo_contacto: new Date().toISOString() })
        .eq('id', cid)
        .in('estado', ['email_enviado', 'seguimiento_1', 'seguimiento_2'])
        .select('nombre, negocio_id')
        .single()

      // Notificar por WhatsApp al dueño del negocio (solo en primera apertura)
      if (updated?.negocio_id) {
        const { data: negocio } = await db
          .from('captia_negocios')
          .select('telefono, nombre')
          .eq('id', updated.negocio_id)
          .single()

        if (negocio?.telefono) {
          await notificarWhatsApp(
            negocio.telefono,
            `🎯 Captia: ${updated.nombre} abrió tu email. Buen momento para llamar.`
          )
        }
      }
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
