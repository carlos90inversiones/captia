export type NegocioEncontrado = {
  place_id: string
  nombre: string
  direccion: string
  ciudad: string
  telefono: string | null
  web: string | null
  rating: number | null
  sector: string
}

export async function buscarNegociosEnGoogleMaps(params: {
  sector: string
  ciudad: string
  radio: number // metros
  maxResultados?: number
}): Promise<NegocioEncontrado[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY no configurada')

  const { sector, ciudad, radio, maxResultados = 20 } = params

  // 1. Geocodificamos la ciudad para obtener coordenadas
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(ciudad + ', España')}&key=${apiKey}`
  const geoRes = await fetch(geoUrl)
  const geoData = await geoRes.json()

  if (!geoData.results?.length) {
    throw new Error(`No se encontraron coordenadas para: ${ciudad}`)
  }

  const { lat, lng } = geoData.results[0].geometry.location

  // 2. Buscamos negocios del sector cerca de esa ciudad
  const query = encodeURIComponent(`${sector} en ${ciudad}`)
  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${lat},${lng}&radius=${radio}&language=es&key=${apiKey}`

  const placesRes = await fetch(placesUrl)
  const placesData = await placesRes.json()

  if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
    throw new Error(`Error Google Places: ${placesData.status}`)
  }

  const resultados = (placesData.results || []).slice(0, maxResultados)

  // 3. Para cada negocio, obtenemos detalles (teléfono, web)
  const negocios: NegocioEncontrado[] = []

  for (const lugar of resultados) {
    try {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lugar.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating&language=es&key=${apiKey}`
      const detailRes = await fetch(detailUrl)
      const detailData = await detailRes.json()
      const d = detailData.result || {}

      negocios.push({
        place_id: lugar.place_id,
        nombre: d.name || lugar.name,
        direccion: d.formatted_address || lugar.formatted_address || '',
        ciudad,
        telefono: d.formatted_phone_number || null,
        web: d.website || null,
        rating: d.rating || lugar.rating || null,
        sector,
      })
    } catch {
      // Si falla el detalle de uno, continuamos con el siguiente
      negocios.push({
        place_id: lugar.place_id,
        nombre: lugar.name,
        direccion: lugar.formatted_address || '',
        ciudad,
        telefono: null,
        web: null,
        rating: lugar.rating || null,
        sector,
      })
    }
  }

  return negocios
}
