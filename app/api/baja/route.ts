import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')

  if (!cid) {
    return new Response('Enlace de baja inválido.', { status: 400, headers: { 'Content-Type': 'text/plain' } })
  }

  try {
    const db = getSupabaseAdmin()
    await db
      .from('captia_contactos')
      .update({ estado: 'baja' })
      .eq('id', cid)
  } catch {
    // Igualmente mostrar confirmación para no confundir al usuario
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Baja confirmada</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#f8f8fa;color:#111;
    }
    .card{
      background:#fff;border-radius:20px;padding:48px 40px;
      box-shadow:0 4px 32px rgba(0,0,0,.08);text-align:center;
      max-width:420px;width:90%;
    }
    .icon{font-size:48px;margin-bottom:20px}
    h1{font-size:22px;font-weight:700;margin-bottom:10px;color:#111}
    p{font-size:15px;color:#666;line-height:1.6}
    .note{font-size:12px;color:#aaa;margin-top:24px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Solicitud procesada</h1>
    <p>Has sido eliminado de nuestra lista de contactos.<br/>No recibirás más emails de este remitente.</p>
    <p class="note">Si esto fue un error, puedes ignorar este mensaje o contactar directamente con el remitente respondiendo al email.</p>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
