import { NextRequest } from 'next/server'
import { generarTexto } from '@/lib/gemini'

export const maxDuration = 30

const H = { 'Content-Type': 'application/json' }

export async function POST(req: NextRequest) {
  try {
    let { url } = await req.json()
    if (!url) return new Response(JSON.stringify({ error: 'url requerida' }), { status: 400, headers: H })

    // Normalizar URL
    if (!url.startsWith('http')) url = 'https://' + url

    // Fetch de la web
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()

    // Extraer texto limpio
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)

    if (texto.length < 50) throw new Error('No se pudo extraer contenido de la web')

    // Gemini analiza
    const prompt = `Analiza el contenido de esta página web y describe el negocio en 2-3 frases cortas y naturales en español.

Incluye: qué hacen exactamente, a quién van dirigidos, y si se menciona, dónde están o dónde operan.
Sé concreto y directo. Sin introducciones, sin "Este negocio es...". Empieza directamente describiendo qué hacen.

Ejemplo de formato esperado: "Instalamos y reparamos sistemas de climatización para hogares y empresas en Sevilla. Hacemos presupuestos sin coste y tenemos servicio de urgencias 24h."

Contenido de la web:
${texto}

Devuelve SOLO la descripción, nada más.`

    const descripcion = (await generarTexto(prompt)).trim()

    return new Response(JSON.stringify({ descripcion }), { status: 200, headers: H })
  } catch (err) {
    console.error('[analizar-web]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: H })
  }
}
