// Powered by OpenStreetMap (Overpass) + DuckDuckGo fallback — gratis, sin API key

export type NegocioEncontrado = {
  place_id: string
  nombre: string
  direccion: string
  ciudad: string
  telefono: string | null
  web: string | null
  email_encontrado: string | null
  rating: number | null
  sector: string
}

/* ═══════════════════════════════════════════════════════
   SECTOR CONFIG — OSM keys para sectores con buena cobertura
   ═══════════════════════════════════════════════════════ */
interface SectorConfig {
  keywords: string[]
  osmKeys: Array<[string, string | null]>
}

const SECTOR_CONFIG: SectorConfig[] = [
  { keywords: ['restauran', 'comida', 'gastro', 'cocina', 'tapas'], osmKeys: [['amenity', 'restaurant']] },
  { keywords: ['cafeter', 'café', 'cafe', 'bar', 'bares', 'cervecería', 'pub'], osmKeys: [['amenity', 'cafe'], ['amenity', 'bar'], ['amenity', 'pub']] },
  { keywords: ['peluquer', 'barbería', 'barberia', 'estética', 'estetica', 'cosmética'], osmKeys: [['shop', 'hairdresser'], ['shop', 'beauty']] },
  { keywords: ['hotel', 'hostal', 'alojamiento', 'turístico', 'rural', 'apartamento turístico'], osmKeys: [['tourism', 'hotel'], ['tourism', 'hostel'], ['tourism', 'guest_house'], ['tourism', 'apartment']] },
  { keywords: ['médico', 'medico', 'clínica', 'clinica', 'doctor', 'consultor'], osmKeys: [['amenity', 'doctors'], ['amenity', 'clinic'], ['healthcare', 'doctor']] },
  { keywords: ['dentist', 'dental', 'odontol'], osmKeys: [['amenity', 'dentist']] },
  { keywords: ['farmaci'], osmKeys: [['amenity', 'pharmacy']] },
  { keywords: ['gimnasio', 'fitness', 'crossfit', 'sport'], osmKeys: [['leisure', 'fitness_centre'], ['leisure', 'sports_centre']] },
  { keywords: ['inmobiliar', 'pisos', 'alquiler de piso'], osmKeys: [['office', 'estate_agent']] },
  { keywords: ['fontaner', 'plomero'], osmKeys: [['craft', 'plumber']] },
  { keywords: ['electric'], osmKeys: [['craft', 'electrician']] },
  { keywords: ['taller', 'mecánic', 'mecanico', 'coches', 'automóvil'], osmKeys: [['shop', 'car_repair'], ['amenity', 'car_repair']] },
  { keywords: ['supermercado', 'alimentaci'], osmKeys: [['shop', 'supermarket'], ['shop', 'convenience']] },
  { keywords: ['tienda ropa', 'moda', ' ropa', 'boutique'], osmKeys: [['shop', 'clothes'], ['shop', 'fashion']] },
  { keywords: ['fisioter', 'fisio'], osmKeys: [['amenity', 'physiotherapist'], ['healthcare', 'physiotherapist']] },
  { keywords: ['academia', 'clases particular', 'formación', 'formacion'], osmKeys: [['amenity', 'language_school'], ['amenity', 'school']] },
]

function getSectorOsmKeys(sector: string): Array<[string, string | null]> | null {
  const s = sector.toLowerCase()
  for (const cfg of SECTOR_CONFIG) {
    if (cfg.keywords.some(k => s.includes(k))) return cfg.osmKeys
  }
  return null // sin OSM → usar fallback
}

/* ═══════════════════════════════════════════════════════
   OVERPASS — búsqueda por tipo (rápida, indexada)
   ═══════════════════════════════════════════════════════ */
async function geocodificarCiudad(ciudad: string): Promise<{ lat: number; lon: number } | null> {
  await new Promise(r => setTimeout(r, 300))
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ciudad + ', España')}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'Captia/1.0 (captia@marsof.es)' } })
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

async function buscarEnOverpass(osmKeys: Array<[string, string | null]>, lat: number, lon: number, radio: number, max: number): Promise<Record<string, unknown>[]> {
  const lines: string[] = []
  for (const [key, val] of osmKeys) {
    const f = val ? `["${key}"="${val}"]` : `["${key}"]`
    lines.push(`  node${f}(around:${radio},${lat},${lon});`)
    lines.push(`  way${f}(around:${radio},${lat},${lon});`)
  }
  const query = `[out:json][timeout:20];\n(\n${lines.join('\n')}\n);\nout body ${max * 2};`
  for (const mirror of ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter']) {
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Captia/1.0 (captia@marsof.es)' },
        signal: AbortSignal.timeout(22000),
      })
      if (!res.ok) continue
      const data = await res.json()
      return (data.elements || []) as Record<string, unknown>[]
    } catch { continue }
  }
  return []
}

/* ═══════════════════════════════════════════════════════
   FALLBACK — DuckDuckGo + scraping de directorios
   ═══════════════════════════════════════════════════════ */
async function buscarEnDirectorios(sector: string, ciudad: string, max: number): Promise<NegocioEncontrado[]> {
  console.log(`[DDG fallback] Buscando "${sector}" en "${ciudad}"`)

  // 1. Buscar en DuckDuckGo
  const query = `${sector} ${ciudad} directorio`
  const body = new URLSearchParams({ q: query, kl: 'es-es', ia: 'web' })
  let ddgHtml = ''
  try {
    const r = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://duckduckgo.com/',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(12000),
    })
    ddgHtml = await r.text()
  } catch (e) {
    console.log('[DDG] Error fetching:', e)
    return []
  }

  // 2. Extraer URLs de resultados
  const rawUrls = [...ddgHtml.matchAll(/href="(https?:\/\/[^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !u.includes('duckduckgo') && !u.includes('duck.com') && u.startsWith('http'))
  const urls = [...new Set(rawUrls)].slice(0, 6)
  console.log(`[DDG] ${urls.length} URLs encontradas: ${urls.slice(0, 3).join(', ')}`)

  // 3. Para cada URL, intentar extraer negocios
  const negocios: NegocioEncontrado[] = []
  const seen = new Set<string>()

  for (const url of urls) {
    if (negocios.length >= max) break
    try {
      const extracted = await extraerNegociosDeDirectorio(url, ciudad, sector)
      for (const neg of extracted) {
        const key = neg.nombre.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          negocios.push(neg)
        }
        if (negocios.length >= max) break
      }
    } catch (e) {
      console.log(`[DDG] Error scraping ${url}:`, String(e).slice(0, 80))
    }
  }

  return negocios
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

async function extraerNegociosDeDirectorio(url: string, ciudad: string, sector: string): Promise<NegocioEncontrado[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []
  const html = await res.text()
  const hostname = new URL(url).hostname

  // Detectar si es un directorio (tiene múltiples H2/H3 con links a negocios)
  const h2h3 = [...html.matchAll(/<h[23][^>]*>([^<]{5,80})<\/h[23]>/gi)].map(m => m[1].trim())
  if (h2h3.length < 3) return [] // no parece directorio

  const negocios: NegocioEncontrado[] = []

  // Patrón 1: link externo + nombre en el mismo bloque (como gestorias24.com)
  const linkNamePattern = /href="(https?:\/\/(?![^"]*(?:duckduck|google|facebook|twitter|instagram|linkedin|yelp|tripadvisor|gestorias24|gestorias\.es|maps\.google))[^"]{10,80})"[^>]*>[\s\S]{0,200}?<div[^>]*>([^<]{5,70})<\/div>/gi
  const matches = [...html.matchAll(linkNamePattern)]

  for (const m of matches.slice(0, 25)) {
    const web = m[1].trim()
    const nombre = decodeHtmlEntities(m[2].replace(/\s+/g, ' ').trim())
    if (!nombre || nombre.length < 4) continue
    if (/^(inicio|home|blog|contacto|sobre|servicios|aviso|política|ver más|siguiente)/i.test(nombre)) continue

    const emailDeWeb = await extraerEmailDeWeb(web)
    negocios.push({
      place_id: `dir-${hostname}-${Buffer.from(nombre).toString('hex').slice(0, 12)}`,
      nombre,
      direccion: ciudad,
      ciudad,
      telefono: null,
      web,
      email_encontrado: emailDeWeb,
      rating: null,
      sector,
    })
  }

  // Patrón 2: JSON-LD con LocalBusiness o ItemList
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1])
      const items = [data, ...(data['@graph'] || []), ...(Array.isArray(data) ? data : [])]
      for (const item of items) {
        if (item['@type'] === 'LocalBusiness' || item['@type']?.includes('Business')) {
          const nombre = decodeHtmlEntities(item.name?.trim() || '')
          if (!nombre || nombre.length < 4) continue
          const web = item.url || item.sameAs || null
          const telefono = item.telephone || null
          const direccion = item.address?.streetAddress || item.address || ciudad
          const emailDes = item.email || (web ? await extraerEmailDeWeb(web) : null)
          negocios.push({
            place_id: `dir-${hostname}-${Buffer.from(nombre).toString('hex').slice(0, 12)}`,
            nombre,
            direccion: typeof direccion === 'string' ? direccion : ciudad,
            ciudad,
            telefono,
            web: typeof web === 'string' ? web : null,
            email_encontrado: emailDes,
            rating: item.aggregateRating?.ratingValue ?? null,
            sector,
          })
        }
      }
    } catch { /* ignorar JSON mal formado */ }
  }

  console.log(`[DIR] ${url.split('/')[2]}: ${negocios.length} negocios extraídos`)
  return negocios
}

/* ═══════════════════════════════════════════════════════
   EMAIL EXTRACTOR
   ═══════════════════════════════════════════════════════ */
export async function extraerEmailDeWeb(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Captia/1.0)' },
    })
    clearTimeout(timeout)
    const html = await res.text()
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
    if (mailtoMatch) return mailtoMatch[1].toLowerCase()
    const emails = (html.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g) || [])
      .filter(e => !e.includes('sentry.io') && !e.includes('example.com') && !e.includes('wixpress.com') && !e.includes('w3.org') && !e.includes('@2x') && !/\d{5}/.test(e))
    return emails[0]?.toLowerCase() || null
  } catch { return null }
}

/* ═══════════════════════════════════════════════════════
   OVERPASS RESULT → NegocioEncontrado
   ═══════════════════════════════════════════════════════ */
async function osmElementToNegocio(el: Record<string, unknown>, sector: string, ciudadDefault: string): Promise<NegocioEncontrado | null> {
  const t = (el.tags || {}) as Record<string, string>
  const nombre = t.name || t['name:es']
  if (!nombre?.trim()) return null
  const web = t.website || t['contact:website'] || t.url || null
  const telefono = t.phone || t['contact:phone'] || null
  const ciudadNeg = t['addr:city'] || t['addr:town'] || t['addr:municipality'] || ciudadDefault
  const calle = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ')
  const direccion = calle ? `${calle}, ${ciudadNeg}` : ciudadNeg
  let email_encontrado: string | null = t.email || t['contact:email'] || null
  if (!email_encontrado && web) email_encontrado = await extraerEmailDeWeb(web)
  return {
    place_id: `osm-${el.type}-${el.id}`,
    nombre,
    direccion,
    ciudad: ciudadNeg,
    telefono: telefono ? telefono.replace(/\s+/g, '').replace(/^0034/, '+34').replace(/^34(?=\d{9}$)/, '+34') : null,
    web,
    email_encontrado,
    rating: null,
    sector,
  }
}

/* ═══════════════════════════════════════════════════════
   FUNCIÓN PRINCIPAL
   ═══════════════════════════════════════════════════════ */
export async function buscarNegociosEnGoogleMaps(params: {
  sector: string
  ciudad: string
  radio: number
  maxResultados?: number
}): Promise<NegocioEncontrado[]> {
  const { sector, ciudad, radio, maxResultados = 20 } = params

  // 1. Intentar Overpass si hay keys OSM para este sector
  const osmKeys = getSectorOsmKeys(sector)
  if (osmKeys) {
    const coords = await geocodificarCiudad(ciudad)
    if (coords) {
      const rawEls = await buscarEnOverpass(osmKeys, coords.lat, coords.lon, radio, maxResultados)
      const elements = rawEls.filter(el => {
        const t = (el.tags || {}) as Record<string, string>
        return t.name?.trim()
      }).slice(0, maxResultados)

      console.log(`[Overpass] ${elements.length} negocios para "${sector}" en ${ciudad}`)

      if (elements.length > 0) {
        const negocios: NegocioEncontrado[] = []
        for (const el of elements) {
          const neg = await osmElementToNegocio(el, sector, ciudad)
          if (neg) negocios.push(neg)
        }
        return negocios
      }
    }
  }

  // 2. Fallback: DuckDuckGo + scraping de directorios
  console.log(`[Captia] Sin datos OSM para "${sector}" — usando fallback DuckDuckGo`)
  return buscarEnDirectorios(sector, ciudad, maxResultados)
}
