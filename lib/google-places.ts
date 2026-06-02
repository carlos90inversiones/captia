// Powered by OpenStreetMap (Overpass API + Nominatim) — completamente gratis, sin API key

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

// Mapping sector → OSM tags (España)
const SECTOR_TAGS: Array<{ keywords: string[]; tags: Array<[string, string]> }> = [
  { keywords: ['gestoría', 'gestoria', 'gestorias', 'gestorías', 'asesoría fiscal', 'asesoria fiscal', 'gestor'], tags: [['office', 'tax_advisor'], ['office', 'accountant']] },
  { keywords: ['asesoría', 'asesoria', 'asesorías', 'asesorias', 'consultoría', 'consultoria', 'asesor'], tags: [['office', 'financial_advisor'], ['office', 'accountant'], ['office', 'company']] },
  { keywords: ['abogado', 'abogados', 'bufete', 'despacho jurídico', 'juridico'], tags: [['office', 'lawyer']] },
  { keywords: ['notaría', 'notaria', 'notario'], tags: [['office', 'notary']] },
  { keywords: ['restaurante', 'restaurantes', 'comida', 'gastronomía'], tags: [['amenity', 'restaurant']] },
  { keywords: ['cafetería', 'cafeteria', 'bar', 'bares', 'café', 'cafe'], tags: [['amenity', 'cafe'], ['amenity', 'bar']] },
  { keywords: ['peluquería', 'peluqueria', 'peluquerías', 'barbería', 'barberia', 'peluquero'], tags: [['shop', 'hairdresser'], ['shop', 'beauty']] },
  { keywords: ['hotel', 'hoteles', 'hostal', 'alojamiento', 'apartamento turístico'], tags: [['tourism', 'hotel'], ['tourism', 'hostel'], ['tourism', 'guest_house']] },
  { keywords: ['médico', 'medico', 'clínica', 'clinica', 'doctor', 'consultorio', 'médicos'], tags: [['amenity', 'doctors'], ['amenity', 'clinic']] },
  { keywords: ['dentista', 'odontólogo', 'odontología', 'dental'], tags: [['amenity', 'dentist']] },
  { keywords: ['farmacia', 'farmacias'], tags: [['amenity', 'pharmacy']] },
  { keywords: ['gimnasio', 'fitness', 'deporte', 'crossfit'], tags: [['leisure', 'fitness_centre'], ['leisure', 'sports_centre']] },
  { keywords: ['inmobiliaria', 'agencia inmobiliaria', 'pisos', 'alquiler', 'inmuebles'], tags: [['office', 'estate_agent']] },
  { keywords: ['arquitecto', 'arquitectura', 'arquitectos'], tags: [['office', 'architect']] },
  { keywords: ['fontanero', 'fontanería', 'instalador', 'fontaneros'], tags: [['craft', 'plumber']] },
  { keywords: ['electricista', 'electricidad', 'electricistas'], tags: [['craft', 'electrician']] },
  { keywords: ['taller', 'mecánico', 'mecanico', 'coches', 'automóvil', 'automocion'], tags: [['shop', 'car_repair'], ['amenity', 'car_repair']] },
  { keywords: ['supermercado', 'alimentación', 'tienda alimentación'], tags: [['shop', 'supermarket'], ['shop', 'convenience']] },
  { keywords: ['tienda ropa', 'moda', 'ropa', 'boutique'], tags: [['shop', 'clothes'], ['shop', 'fashion']] },
  { keywords: ['psicólogo', 'psicologo', 'psicología', 'terapia', 'psicólogos'], tags: [['amenity', 'psychologist'], ['healthcare', 'psychotherapist']] },
  { keywords: ['fisioterapeuta', 'fisioterapia', 'fisio'], tags: [['amenity', 'physiotherapist'], ['healthcare', 'physiotherapist']] },
  { keywords: ['academia', 'clases particulares', 'formación', 'educacion'], tags: [['amenity', 'school'], ['amenity', 'language_school'], ['office', 'educational_institution']] },
]

function sectorToTags(sector: string): Array<[string, string]> {
  const s = sector.toLowerCase()
  for (const { keywords, tags } of SECTOR_TAGS) {
    if (keywords.some(k => s.includes(k))) return tags
  }
  return [] // sin tags → búsqueda por nombre
}

async function geocodificarCiudad(ciudad: string): Promise<{ lat: number; lon: number } | null> {
  await new Promise(r => setTimeout(r, 300)) // Nominatim: 1 req/s
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ciudad + ', España')}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Captia/1.0 (captia@marsof.es)' }
  })
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

async function extraerEmailDeWeb(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Captia/1.0)' }
    })
    clearTimeout(timeout)
    const html = await res.text()

    // Primero buscamos enlaces mailto:
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
    if (mailtoMatch) return mailtoMatch[1].toLowerCase()

    // Luego cualquier email en el texto
    const emails = html.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g) || []
    const validos = emails.filter(e =>
      !e.includes('sentry.io') &&
      !e.includes('example.com') &&
      !e.includes('wixpress.com') &&
      !e.includes('w3.org') &&
      !e.includes('@2x') &&
      !e.includes('.png') &&
      !e.includes('.jpg') &&
      !/\d{5}/.test(e)
    )
    return validos[0]?.toLowerCase() || null
  } catch {
    return null
  }
}

function buildOverpassQuery(
  tags: Array<[string, string]>,
  lat: number,
  lon: number,
  radio: number,
  sector: string,
  max: number
): string {
  if (tags.length === 0) {
    // Sin tags conocidos → búsqueda por nombre del sector
    return `[out:json][timeout:30];
(
  node["name"~"${sector}",i](around:${radio},${lat},${lon});
  way["name"~"${sector}",i](around:${radio},${lat},${lon});
);
out body ${max};`
  }

  const partes = tags.flatMap(([k, v]) => [
    `  node["${k}"="${v}"](around:${radio},${lat},${lon});`,
    `  way["${k}"="${v}"](around:${radio},${lat},${lon});`,
  ])

  return `[out:json][timeout:30];
(
${partes.join('\n')}
);
out body ${max};`
}

export async function buscarNegociosEnGoogleMaps(params: {
  sector: string
  ciudad: string
  radio: number
  maxResultados?: number
}): Promise<NegocioEncontrado[]> {
  const { sector, ciudad, radio, maxResultados = 20 } = params

  // 1. Geocodificamos la ciudad con Nominatim (gratis)
  const coords = await geocodificarCiudad(ciudad)
  if (!coords) throw new Error(`No se encontraron coordenadas para: ${ciudad}`)
  const { lat, lon } = coords

  // 2. Buscamos negocios con Overpass API (gratis)
  const tags = sectorToTags(sector)
  const query = buildOverpassQuery(tags, lat, lon, radio, sector, maxResultados * 2)

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Captia/1.0 (captia@marsof.es)'
    }
  })

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`)

  const data = await res.json()
  const elements = ((data.elements || []) as Record<string, unknown>[])
    .filter(el => {
      const t = (el.tags || {}) as Record<string, string>
      return t.name && t.name.trim().length > 0
    })
    .slice(0, maxResultados)

  // 3. Para cada negocio, intentamos extraer email de su web
  const negocios: NegocioEncontrado[] = []

  for (const el of elements) {
    const t = (el.tags || {}) as Record<string, string>
    const nombre = t.name || t['name:es']
    if (!nombre) continue

    const web = t.website || t['contact:website'] || t.url || null
    const telefono = t.phone || t['contact:phone'] || null
    const ciudadNeg = t['addr:city'] || t['addr:town'] || t['addr:municipality'] || ciudad
    const calle = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ')
    const direccion = calle ? `${calle}, ${ciudadNeg}` : ciudadNeg

    // Email: primero del tag OSM, luego intentamos extraerlo del sitio web
    let email_encontrado: string | null = t.email || t['contact:email'] || null
    if (!email_encontrado && web) {
      email_encontrado = await extraerEmailDeWeb(web)
    }

    negocios.push({
      place_id: `osm-${el.type}-${el.id}`,
      nombre,
      direccion,
      ciudad: ciudadNeg,
      telefono: telefono
        ? telefono.replace(/\s+/g, '').replace(/^0034/, '+34').replace(/^34(?=\d{9}$)/, '+34')
        : null,
      web,
      email_encontrado,
      rating: null,
      sector,
    })
  }

  return negocios
}
