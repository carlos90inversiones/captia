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
  // ── Hostelería ──
  { keywords: ['restauran', 'comida', 'gastro', 'cocina', 'tapas'], osmKeys: [['amenity', 'restaurant']] },
  { keywords: ['cafeter', 'café', 'cafe', 'bar', 'bares', 'cervecería', 'pub'], osmKeys: [['amenity', 'cafe'], ['amenity', 'bar'], ['amenity', 'pub']] },
  { keywords: ['hotel', 'hostal', 'alojamiento', 'turístico', 'rural', 'apartamento turístico'], osmKeys: [['tourism', 'hotel'], ['tourism', 'hostel'], ['tourism', 'guest_house'], ['tourism', 'apartment']] },
  // ── Salud ──
  { keywords: ['médico', 'medico', 'clínica', 'clinica', 'doctor', 'consultor médic'], osmKeys: [['amenity', 'doctors'], ['amenity', 'clinic'], ['healthcare', 'doctor']] },
  { keywords: ['dentist', 'dental', 'odontol'], osmKeys: [['amenity', 'dentist']] },
  { keywords: ['farmaci'], osmKeys: [['amenity', 'pharmacy']] },
  { keywords: ['fisioter', 'fisio'], osmKeys: [['amenity', 'physiotherapist'], ['healthcare', 'physiotherapist']] },
  { keywords: ['psicolog', 'terapeuta', 'psiquiat'], osmKeys: [['amenity', 'therapist'], ['healthcare', 'psychotherapist']] },
  { keywords: ['veterinar', 'clínica veterinaria'], osmKeys: [['amenity', 'veterinary']] },
  { keywords: ['óptica', 'optica'], osmKeys: [['shop', 'optician']] },
  // ── Belleza ──
  { keywords: ['peluquer', 'barbería', 'barberia'], osmKeys: [['shop', 'hairdresser'], ['shop', 'barber']] },
  { keywords: ['estética', 'estetica', 'cosmética', 'cosmetica', 'belleza', 'spa'], osmKeys: [['shop', 'beauty'], ['leisure', 'spa']] },
  { keywords: ['gimnasio', 'fitness', 'crossfit', 'pilates', 'yoga'], osmKeys: [['leisure', 'fitness_centre'], ['leisure', 'sports_centre']] },
  // ── Retail ──
  { keywords: ['inmobiliar', 'pisos', 'alquiler de piso', 'agencia inmobiliaria'], osmKeys: [['office', 'estate_agent']] },
  { keywords: ['supermercado', 'alimentaci'], osmKeys: [['shop', 'supermarket'], ['shop', 'convenience']] },
  { keywords: ['tienda ropa', 'moda', ' ropa', 'boutique'], osmKeys: [['shop', 'clothes'], ['shop', 'fashion']] },
  { keywords: ['florist', 'flores'], osmKeys: [['shop', 'florist']] },
  { keywords: ['librería', 'libreria', 'papelería'], osmKeys: [['shop', 'books'], ['shop', 'stationery']] },
  { keywords: ['joyería', 'joyeria', 'relojería'], osmKeys: [['shop', 'jewelry']] },
  { keywords: ['panadería', 'panaderia', 'pastelería', 'pasteleria'], osmKeys: [['shop', 'bakery']] },
  // ── Oficios ──
  { keywords: ['fontaner', 'plomero'], osmKeys: [['craft', 'plumber']] },
  { keywords: ['electric'], osmKeys: [['craft', 'electrician']] },
  { keywords: ['carpinter'], osmKeys: [['craft', 'carpenter']] },
  { keywords: ['pintor', 'pintura'], osmKeys: [['craft', 'painter']] },
  { keywords: ['taller', 'mecánic', 'mecanico', 'coches', 'automóvil'], osmKeys: [['shop', 'car_repair'], ['amenity', 'car_repair']] },
  // ── Educación ──
  { keywords: ['academia', 'clases particular', 'formación', 'formacion', 'idiomas'], osmKeys: [['amenity', 'language_school'], ['amenity', 'college']] },
  { keywords: ['guardería', 'guarderia', 'infantil', 'escuela infantil'], osmKeys: [['amenity', 'kindergarten']] },
  // ── B2B / Servicios profesionales ──
  { keywords: ['gestor', 'gestoría', 'gestoria', 'asesor', 'asesoría', 'asesoria', 'fiscal', 'contabilidad', 'contable', 'laboral'], osmKeys: [['office', 'accountant'], ['office', 'tax_advisor']] },
  { keywords: ['abogado', 'abogados', 'jurídico', 'juridico', 'derecho', 'notario', 'despacho legal'], osmKeys: [['office', 'lawyer'], ['amenity', 'lawyer']] },
  { keywords: ['arquitecto', 'arquitectura', 'obra', 'diseño de interiores', 'reformas'], osmKeys: [['office', 'architect']] },
  { keywords: ['seguro', 'seguros', 'correduría de seguros', 'agente de seguros'], osmKeys: [['office', 'insurance']] },
  { keywords: ['informática', 'informatica', 'software', 'tecnología', 'tecnologia', 'desarrollo web', 'it ', 'programad'], osmKeys: [['office', 'it'], ['office', 'software']] },
  { keywords: ['marketing', 'publicidad', 'agencia de comunicación', 'comunicación digital', 'diseño gráfico'], osmKeys: [['office', 'marketing'], ['office', 'advertising_agency']] },
  { keywords: ['consultor', 'consultora', 'consultoría', 'consultoria'], osmKeys: [['office', 'company'], ['office', 'consulting']] },
  { keywords: ['empresa de limpieza', 'limpieza de oficinas', 'servicio de limpieza'], osmKeys: [['shop', 'cleaning']] },
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
   PÁGINAS AMARILLAS — directorio español más completo
   ═══════════════════════════════════════════════════════ */

const PA_SECTOR_MAP: [string[], string][] = [
  [['farmaci'], 'farmacias'],
  [['restauran', 'gastro', 'cocina', 'tapas'], 'restaurantes'],
  [['cafeter', 'café', 'cafe'], 'cafeterias'],
  [['bar', 'pub', 'cervecería', 'cerveceria'], 'bares'],
  [['peluquer'], 'peluquerias'],
  [['barbería', 'barberia'], 'barberias'],
  [['estetica', 'estética', 'cosmética', 'cosmetica', 'belleza'], 'centros-de-estetica'],
  [['hotel'], 'hoteles'],
  [['hostal'], 'hostales'],
  [['alojamiento', 'turístico', 'turistico', 'rural'], 'alojamientos-rurales'],
  [['médico', 'medico', 'doctor', 'consultor médico'], 'medicos'],
  [['clínica', 'clinica'], 'clinicas'],
  [['dentist', 'dental', 'odontol'], 'dentistas'],
  [['gimnasio', 'fitness', 'crossfit'], 'gimnasios'],
  [['inmobiliar'], 'inmobiliarias'],
  [['fontaner', 'plomero'], 'fontaneros'],
  [['electric'], 'electricistas'],
  [['taller', 'mecánic', 'mecanico', 'automóvil', 'automovil'], 'talleres-mecanicos'],
  [['fisioter', 'fisio'], 'fisioterapeutas'],
  [['academia', 'clases particular', 'formación', 'formacion'], 'academias'],
  [['abogado', 'jurídico', 'juridico', 'derecho'], 'abogados'],
  [['gestoria', 'gestoría', 'contabilidad', 'asesor fiscal', 'fiscal', 'contable'], 'gesto-asesorias'],
  [['seguro', 'seguros'], 'seguros'],
  [['arquitecto'], 'arquitectos'],
  [['psicolog'], 'psicologos'],
  [['veterinar'], 'veterinarios'],
  [['pintor', 'pintura'], 'pintores'],
  [['carpinter'], 'carpinteros'],
  [['cerrajer'], 'cerrajeros'],
  [['mudanza'], 'mudanzas'],
  [['limpieza'], 'empresas-de-limpieza'],
  [['informática', 'informatica', 'tecnología', 'tecnologia', 'software', 'desarrollo web', 'digital'], 'empresas-de-informatica'],
  [['marketing', 'publicidad', 'agencia de comunicación'], 'agencias-de-publicidad'],
  [['transporte', 'logística', 'logistica', 'mensajería', 'mensajeria'], 'transporte'],
  [['construcción', 'construccion', 'obra', 'reformas'], 'empresas-de-construccion'],
  [['florist'], 'floristerias'],
  [['óptica', 'optica'], 'opticas'],
  [['joyería', 'joyeria'], 'joyerias'],
  [['supermercado', 'alimentaci'], 'alimentacion'],
  [['ropa', 'moda', 'boutique'], 'ropa'],
]

function getSectorPA(sector: string): string | null {
  const s = sector.toLowerCase()
  for (const [keywords, paQuery] of PA_SECTOR_MAP) {
    if (keywords.some(k => s.includes(k))) return paQuery
  }
  // Generic fallback: use first meaningful word
  const palabras = s.split(/\s+/).filter(w => w.length > 4 && !['para', 'como', 'este', 'esta', 'empresa', 'negocio', 'automatizacion', 'automatización'].includes(w))
  return palabras[0] ? encodeURIComponent(palabras[0]) : null
}

function normalizarCiudadPA(ciudad: string): string {
  return ciudad.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function formatTelefonoPa(tel: string): string | null {
  if (!tel) return null
  const clean = String(tel).replace(/\s+/g, '').replace(/^0034/, '+34').replace(/^34(?=\d{9}$)/, '+34')
  if (clean.replace(/\D/g, '').length < 9) return null
  return clean
}

// Recursively search for business-like objects in a JSON tree
function extraerNegociosDeJson(obj: unknown, sector: string, ciudad: string, max: number, seen: Set<string>, acc: NegocioEncontrado[] = [], depth = 0): NegocioEncontrado[] {
  if (depth > 12 || acc.length >= max) return acc
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extraerNegociosDeJson(item, sector, ciudad, max, seen, acc, depth + 1)
      if (acc.length >= max) break
    }
  } else if (obj && typeof obj === 'object') {
    const o = obj as Record<string, unknown>
    const nombre = String(o.name || o.nombre || o.title || o.businessName || o.razonSocial || o.denominacion || '').trim()
    if (nombre && nombre.length >= 3 && nombre.length <= 120 && !/^(true|false|null|\d+)$/.test(nombre)) {
      const direccion = String(o.address || o.direccion || o.street || o.streetAddress || '').trim() || ciudad
      const telefono = String(o.phone || o.telefono || o.telephone || o.phoneNumber || o.tlf || '').trim()
      const web = String(o.website || o.web || o.url || o.link || o.siteUrl || '').trim()
      const email = String(o.email || o.mail || o.correo || '').trim()
      const tel = formatTelefonoPa(telefono)
      if (tel || direccion.length > 5 || (web && web.startsWith('http'))) {
        const key = nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25)
        if (!seen.has(key)) {
          seen.add(key)
          acc.push({
            place_id: `pa-${Buffer.from(nombre + ciudad).toString('hex').slice(0, 16)}`,
            nombre,
            direccion: direccion || ciudad,
            ciudad,
            telefono: tel,
            web: (web && web.startsWith('http')) ? web : null,
            email_encontrado: (email && email.includes('@')) ? email.toLowerCase() : null,
            rating: typeof o.rating === 'number' ? o.rating : (typeof o.score === 'number' ? o.score : null),
            sector,
          })
        }
        return acc // don't recurse into a matched node
      }
    }
    for (const val of Object.values(o)) {
      extraerNegociosDeJson(val, sector, ciudad, max, seen, acc, depth + 1)
      if (acc.length >= max) break
    }
  }
  return acc
}

function extraerListingsHtmlPA(html: string, sector: string, ciudad: string, max: number): NegocioEncontrado[] {
  const acc: NegocioEncontrado[] = []
  const seen = new Set<string>()
  // Try <article> blocks first, then <li> blocks
  const blockRx = [/<article[^>]*>([\s\S]*?)<\/article>/gi, /<li[^>]*class="[^"]*(?:listing|result|item|negocio)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi]
  for (const rx of blockRx) {
    for (const m of html.matchAll(rx)) {
      if (acc.length >= max) break
      const blk = m[1]
      const nm = blk.match(/<h[123][^>]*>([^<]{3,80})<\/h[123]>/i) ||
                 blk.match(/class="[^"]*(?:name|title|heading|negocio|empresa)[^"]*"[^>]*>([^<]{3,80})</)
      if (!nm) continue
      const nombre = decodeHtmlEntities(nm[1].trim())
      if (!nombre || nombre.length < 3) continue
      const key = nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25)
      if (seen.has(key)) continue
      seen.add(key)
      const ph = blk.match(/(\+?34?\s*\d[\d\s.-]{7,})/i)
      const wb = blk.match(/href="(https?:\/\/(?!(?:www\.paginasamarillas|google|facebook|twitter))[^"]{8,80})"/)
      const ad = blk.match(/<address[^>]*>([^<]{5,100})<\/address>/i) ||
                 blk.match(/class="[^"]*(?:address|direccion)[^"]*"[^>]*>([^<]{5,100})</)
      acc.push({
        place_id: `pa-html-${Buffer.from(nombre + ciudad).toString('hex').slice(0, 16)}`,
        nombre,
        direccion: ad ? decodeHtmlEntities(ad[1].trim()) : ciudad,
        ciudad,
        telefono: ph ? formatTelefonoPa(ph[1]) : null,
        web: wb ? wb[1] : null,
        email_encontrado: null,
        rating: null,
        sector,
      })
    }
    if (acc.length > 0) break
  }
  return acc
}

async function buscarEnPaginasAmarillas(sector: string, ciudad: string, max: number): Promise<NegocioEncontrado[]> {
  const paQuery = getSectorPA(sector)
  if (!paQuery) return []

  const ciudadNorm = normalizarCiudadPA(ciudad)
  const url = `https://www.paginasamarillas.es/search/${paQuery}/${ciudadNorm}/`
  console.log(`[PA] ${url}`)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://www.paginasamarillas.es/',
      },
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) { console.log(`[PA] HTTP ${res.status}`); return [] }
    const html = await res.text()
    console.log(`[PA] ${html.length} bytes`)

    const seen = new Set<string>()

    // Strategy 1: __NEXT_DATA__ (Next.js SSR)
    const ndm = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (ndm) {
      try {
        const nd = JSON.parse(ndm[1])
        const r = extraerNegociosDeJson(nd, sector, ciudad, max, seen)
        if (r.length > 0) { console.log(`[PA] ${r.length} de __NEXT_DATA__`); return r }
      } catch { /* ignore */ }
    }

    // Strategy 2: JSON-LD schema.org
    const ldNegocios: NegocioEncontrado[] = []
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      if (ldNegocios.length >= max) break
      try {
        const d = JSON.parse(block[1])
        const items = [d, ...(d['@graph'] || []), ...(Array.isArray(d) ? d : [])]
        for (const item of items) {
          if (ldNegocios.length >= max) break
          const tipo = String(item['@type'] || '')
          if (!['LocalBusiness','Organization','Store','FoodEstablishment','Restaurant','MedicalOrganization'].some(t => tipo.includes(t))) continue
          const nombre = item.name?.trim()
          if (!nombre || nombre.length < 3) continue
          const key = nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25)
          if (seen.has(key)) continue
          seen.add(key)
          const dir = item.address?.streetAddress || item.address || ciudad
          ldNegocios.push({
            place_id: `pa-ld-${Buffer.from(nombre + ciudad).toString('hex').slice(0, 16)}`,
            nombre,
            direccion: typeof dir === 'string' ? dir : ciudad,
            ciudad,
            telefono: item.telephone ? formatTelefonoPa(String(item.telephone)) : null,
            web: typeof item.url === 'string' ? item.url : null,
            email_encontrado: typeof item.email === 'string' ? item.email.toLowerCase() : null,
            rating: item.aggregateRating?.ratingValue ?? null,
            sector,
          })
        }
      } catch { /* ignore */ }
    }
    if (ldNegocios.length > 0) { console.log(`[PA] ${ldNegocios.length} de JSON-LD`); return ldNegocios }

    // Strategy 3: HTML article/li parsing
    const htmlNegocios = extraerListingsHtmlPA(html, sector, ciudad, max)
    console.log(`[PA] ${htmlNegocios.length} del HTML`)
    return htmlNegocios

  } catch (err) {
    console.log(`[PA] Error: ${String(err).slice(0, 100)}`)
    return []
  }
}

/* ═══════════════════════════════════════════════════════
   YELP FUSION API — 5.000 req/día gratis, excelente España
   Solo activo si YELP_API_KEY está configurado en .env.local
   ═══════════════════════════════════════════════════════ */
async function buscarEnYelp(sector: string, ciudad: string, radio: number, max: number): Promise<NegocioEncontrado[]> {
  const apiKey = process.env.YELP_API_KEY
  if (!apiKey) return []

  const url = new URL('https://api.yelp.com/v3/businesses/search')
  url.searchParams.set('term', sector)
  url.searchParams.set('location', `${ciudad}, España`)
  url.searchParams.set('limit', String(Math.min(max, 50)))
  url.searchParams.set('locale', 'es_ES')
  url.searchParams.set('radius', String(Math.min(radio, 40000)))

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      console.log(`[Yelp] HTTP ${res.status}: ${await res.text().then(t => t.slice(0, 100))}`)
      return []
    }
    const data = await res.json() as { businesses?: Record<string, unknown>[] }
    const businesses = data.businesses || []
    console.log(`[Yelp] ${businesses.length} negocios para "${sector}" en ${ciudad}`)

    const negocios: NegocioEncontrado[] = []
    for (const b of businesses) {
      const nombre = String(b.name || '').trim()
      if (!nombre) continue
      const loc = (b.location || {}) as Record<string, unknown>
      const direccion = [loc.address1, loc.address2].filter(Boolean).join(', ') || String(loc.display_address || ciudad)
      const telefono = String(b.phone || b.display_phone || '').replace(/\s/g, '') || null
      const tel = telefono ? formatTelefonoPa(telefono) : null
      negocios.push({
        place_id: `yelp-${b.id || Buffer.from(nombre + ciudad).toString('hex').slice(0, 16)}`,
        nombre,
        direccion: typeof direccion === 'string' ? direccion : ciudad,
        ciudad,
        telefono: tel,
        web: null, // Yelp no devuelve la web del negocio, usar Enriquecer
        email_encontrado: null,
        rating: typeof b.rating === 'number' ? b.rating : null,
        sector,
      })
    }
    return negocios
  } catch (err) {
    console.log(`[Yelp] Error: ${String(err).slice(0, 100)}`)
    return []
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

  // 1. Correr OSM, Páginas Amarillas y Yelp en paralelo
  const [osmNegocios, paNegocios, yelpNegocios] = await Promise.all([
    // Track OSM/Overpass
    (async (): Promise<NegocioEncontrado[]> => {
      const osmKeys = getSectorOsmKeys(sector)
      if (!osmKeys) return []
      const coords = await geocodificarCiudad(ciudad)
      if (!coords) return []
      const rawEls = await buscarEnOverpass(osmKeys, coords.lat, coords.lon, radio, maxResultados)
      const elements = rawEls.filter(el => ((el.tags || {}) as Record<string, string>).name?.trim()).slice(0, maxResultados)
      console.log(`[Overpass] ${elements.length} negocios para "${sector}" en ${ciudad}`)
      const negocios: NegocioEncontrado[] = []
      for (const el of elements) {
        const neg = await osmElementToNegocio(el, sector, ciudad)
        if (neg) negocios.push(neg)
      }
      return negocios
    })(),
    // Track Páginas Amarillas (graceful: si está bloqueado devuelve [])
    buscarEnPaginasAmarillas(sector, ciudad, maxResultados),
    // Track Yelp (solo si YELP_API_KEY está configurado)
    buscarEnYelp(sector, ciudad, radio, maxResultados),
  ])

  // 2. Merge deduplicando por nombre — prioridad: OSM > Yelp > PA
  const seen = new Set<string>()
  const merged: NegocioEncontrado[] = []
  for (const neg of [...osmNegocios, ...yelpNegocios, ...paNegocios]) {
    const key = neg.nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(neg)
    }
    if (merged.length >= maxResultados) break
  }

  if (merged.length > 0) {
    console.log(`[Captia] ${merged.length} total (OSM:${osmNegocios.length} + Yelp:${yelpNegocios.length} + PA:${paNegocios.length})`)
    return merged
  }

  // 3. Fallback: DuckDuckGo + scraping de directorios
  console.log(`[Captia] Sin resultados — usando fallback DuckDuckGo`)
  return buscarEnDirectorios(sector, ciudad, maxResultados)
}
