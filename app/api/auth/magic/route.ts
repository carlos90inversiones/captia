import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const H = { 'Content-Type': 'application/json' }
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://captia.vercel.app'

// POST /api/auth/magic { email }
// Finds negocios registered with that email and sends a magic access link
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400, headers: H })
    }

    const db = getSupabaseAdmin()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Find all negocios with this email
    const { data: negocios } = await db
      .from('captia_negocios')
      .select('id, nombre, ciudad, sector')
      .eq('email', email.toLowerCase().trim())

    if (!negocios?.length) {
      // Don't reveal if email exists — just say "if registered, you'll get an email"
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: H })
    }

    // Build the email content
    const linksHtml = negocios.map(n =>
      `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
          <strong style="color:#111;font-size:15px">${n.nombre}</strong>
          <span style="color:#999;font-size:13px;margin-left:8px">${n.ciudad}</span><br/>
          <a href="${BASE_URL}/dashboard?id=${n.id}" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
            Acceder al panel →
          </a>
        </td>
      </tr>`
    ).join('')

    await resend.emails.send({
      from: 'Captia <captia@marsof.es>',
      to: email.toLowerCase().trim(),
      subject: '🔑 Tu acceso a Captia',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <span style="font-size:24px">⚡</span>
            <span style="font-weight:700;font-size:20px">Captia</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Tu enlace de acceso</h1>
          <p style="font-size:15px;color:#555;margin:0 0 24px">Haz clic en el botón de tu negocio para acceder al panel de control.</p>
          <table style="width:100%">${linksHtml}</table>
          <p style="font-size:12px;color:#aaa;margin-top:28px">Este enlace nunca caduca. Si no pediste acceso, ignora este email.</p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: H })
  } catch (err) {
    console.error('[auth/magic POST]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: H })
  }
}
