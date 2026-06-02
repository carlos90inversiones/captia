import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extraerEmailDeWeb } from '@/lib/google-places'

export const maxDuration = 60

const H = { 'Content-Type': 'application/json' }

async function buscarEmailEnDDG(nombre: string, ciudad: string): Promise<string | null> {
  try {
    const query = `"${nombre}" "${ciudad}" email contacto`
    const body = new URLSearchParams({ q: query, kl: 'es-es' })
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://duckduckgo.com/',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    // Try to find email directly in SERP
    const directEmails = (html.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g) || [])
      .filter(e => !e.includes('duckduckgo') && !e.includes('example') && !e.includes('w3.org') && !e.includes('@2x'))
    if (directEmails.length > 0) return directEmails[0].toLowerCase()

    // Extract URLs from results and try scraping top 2
    const urls = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map(m => m[1])
      .filter(u => !u.includes('duckduckgo') && !u.includes('duck.com') && u.startsWith('http'))
    const uniqueUrls = [...new Set(urls)].slice(0, 2)

    for (const url of uniqueUrls) {
      const email = await extraerEmailDeWeb(url)
      if (email) return email
      await new Promise(r => setTimeout(r, 500))
    }
    return null
  } catch { return null }
}

// POST /api/enriquecer { negocio_id }
// Finds emails for contacts that have none — up to 10 per batch
export async function POST(req: NextRequest) {
  try {
    const { negocio_id } = await req.json()
    if (!negocio_id) return new Response(JSON.stringify({ error: 'negocio_id requerido' }), { status: 400, headers: H })

    const db = getSupabaseAdmin()

    // Get contacts without email (max 10 per batch to stay within Vercel timeout)
    const { data: contactos } = await db
      .from('captia_contactos')
      .select('id, nombre, ciudad, web')
      .eq('negocio_id', negocio_id)
      .is('email_encontrado', null)
      .neq('estado', 'baja')
      .limit(10)

    if (!contactos?.length) {
      return new Response(JSON.stringify({ enriquecidos: 0, pendientes: 0, mensaje: 'No hay contactos sin email' }), { status: 200, headers: H })
    }

    let enriquecidos = 0
    const errores: string[] = []

    for (const contacto of contactos) {
      try {
        let email: string | null = null

        // 1. Try web scraping if they have a URL
        if (contacto.web) {
          email = await extraerEmailDeWeb(contacto.web)
        }

        // 2. Search DuckDuckGo for their email
        if (!email) {
          email = await buscarEmailEnDDG(contacto.nombre, contacto.ciudad)
        }

        if (email) {
          await db.from('captia_contactos').update({ email_encontrado: email }).eq('id', contacto.id)
          enriquecidos++
        }
      } catch (err) {
        errores.push(`${contacto.nombre}: ${String(err).slice(0, 100)}`)
      }
      // Pause to avoid rate limiting DuckDuckGo
      await new Promise(r => setTimeout(r, 2000))
    }

    // Count how many still lack emails after this batch
    const { count: pendientes } = await db
      .from('captia_contactos')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocio_id)
      .is('email_encontrado', null)
      .neq('estado', 'baja')

    return new Response(JSON.stringify({ enriquecidos, pendientes: pendientes || 0, errores }), { status: 200, headers: H })
  } catch (err) {
    console.error('[enriquecer POST]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: H })
  }
}
