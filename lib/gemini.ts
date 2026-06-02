import { GoogleGenerativeAI } from '@google/generative-ai'

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')
  return new GoogleGenerativeAI(apiKey)
}

export async function generarTexto(prompt: string): Promise<string> {
  const genAI = getGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

/* ═══════════════════════════════════════════════════════
   PLANTILLAS DE FALLBACK — 5 variantes rotativas, alta calidad
   ═══════════════════════════════════════════════════════ */
function emailPorPlantilla(params: {
  negocioOrigen: string
  sectorOrigen: string
  descripcionOrigen: string
  nombreDestino: string
  sectorDestino: string
  ciudadDestino: string
  tono: string
}): { asunto: string; cuerpo: string } {
  const { negocioOrigen, sectorOrigen, descripcionOrigen, nombreDestino, ciudadDestino, tono } = params
  const cercano = tono === 'cercano'

  // Elegir variante según hash del nombre (siempre la misma para el mismo contacto)
  const hash = nombreDestino.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const v = hash % 5

  // Limpiar descripción: quitar punto final y forzar minúscula solo en el primer carácter
  const desc = descripcionOrigen.trim().replace(/\.+$/, '')
  const descMin = desc.charAt(0).toLowerCase() + desc.slice(1)

  const variantes: Array<{ asunto: string; cuerpo: string }> = [
    {
      asunto: `Una idea para ${nombreDestino}`,
      cuerpo: `${cercano ? 'Hola' : 'Buenos días'},\n\nMe llamo Carlos y dirijo ${negocioOrigen}, empresa de ${ciudadDestino} especializada en ${sectorOrigen.toLowerCase()}.\n\nHe visto el trabajo de ${nombreDestino} y creo que podríamos ayudaros con ${descMin}.\n\n¿Tenéis 15 minutos esta semana para contaros cómo lo hacemos con otros negocios del sector?\n\nUn saludo,\nCarlos — ${negocioOrigen}`,
    },
    {
      asunto: `${negocioOrigen} → ${nombreDestino}`,
      cuerpo: `${cercano ? 'Hola' : 'Buenos días'},\n\nSoy Carlos, de ${negocioOrigen}. Trabajamos con negocios como ${nombreDestino} ayudándoles a ${descMin}.\n\nHe estado mirando vuestro trabajo en ${ciudadDestino} y me parece que hay una oportunidad clara en la que podemos ayudaros.\n\n¿Os viene bien una llamada rápida esta semana?\n\nSaludos,\nCarlos — ${negocioOrigen}`,
    },
    {
      asunto: `Propuesta para ${nombreDestino}`,
      cuerpo: `${cercano ? 'Hola' : 'Buenas'},\n\nDesde ${negocioOrigen} llevamos tiempo ayudando a negocios de ${ciudadDestino} con ${sectorOrigen.toLowerCase()}.\n\nVi ${nombreDestino} y quería contactaros directamente porque creo que lo que hacemos encaja con lo que necesitáis.\n\n¿Hablamos 15 minutos esta semana sin compromiso?\n\nUn saludo,\n${negocioOrigen}`,
    },
    {
      asunto: `Hola desde ${negocioOrigen}`,
      cuerpo: `${cercano ? 'Hola' : 'Buenos días'},\n\nSoy Carlos de ${negocioOrigen}, y me dedico a ${descMin} para empresas en ${ciudadDestino}.\n\nHe encontrado ${nombreDestino} y creo que podríamos aportaros valor real en este área.\n\n¿Podemos hablar esta semana? No más de 15 minutos.\n\nSaludos,\nCarlos`,
    },
    {
      asunto: `¿Podemos ayudar a ${nombreDestino}?`,
      cuerpo: `${cercano ? 'Hola' : 'Buenos días'},\n\nOs escribo desde ${negocioOrigen}. Somos una empresa de ${ciudadDestino} especializada en ${sectorOrigen.toLowerCase()} y trabajamos con negocios de vuestro sector.\n\nMe gustaría contaros en 15 minutos cómo ayudamos a empresas como ${nombreDestino}. Sin compromiso.\n\n¿Hay hueco esta semana?\n\nUn saludo,\nCarlos — ${negocioOrigen}`,
    },
  ]

  return variantes[v]
}

export async function generarEmailOutreach(params: {
  negocioOrigen: string
  sectorOrigen: string
  descripcionOrigen: string
  nombreDestino: string
  sectorDestino: string
  ciudadDestino: string
  tono: string
}): Promise<{ asunto: string; cuerpo: string }> {
  const { negocioOrigen, sectorOrigen, descripcionOrigen, nombreDestino, sectorDestino, ciudadDestino, tono } = params

  const prompt = `Eres un experto en ventas B2B español. Escribe un email de presentación comercial en español.

EMISOR (quien manda el email):
- Empresa: ${negocioOrigen}
- Sector: ${sectorOrigen}
- Descripción: ${descripcionOrigen}

DESTINATARIO (quien recibe el email):
- Empresa: ${nombreDestino}
- Sector: ${sectorDestino}
- Ciudad: ${ciudadDestino}

TONO: ${tono}

INSTRUCCIONES:
- Email corto (máximo 5 líneas de cuerpo)
- Natural, como si lo escribiera una persona real
- No uses frases genéricas de ventas
- No menciones precios
- Termina con una pregunta concreta para abrir conversación
- Sin saludos corporativos tipo "Estimado/a"

Devuelve SOLO un JSON con este formato exacto:
{"asunto": "...", "cuerpo": "..."}`

  try {
    const texto = await generarTexto(prompt)
    const limpio = texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(limpio)
  } catch {
    // Fallback a plantilla si Gemini falla (cuota, red, etc.)
    console.warn('[gemini] Usando plantilla de fallback para:', nombreDestino)
    return emailPorPlantilla({ negocioOrigen, sectorOrigen, descripcionOrigen, nombreDestino, sectorDestino, ciudadDestino, tono })
  }
}

export async function generarPostSocial(params: {
  negocio: string
  sector: string
  descripcion: string
  clienteIdeal: string
  red: 'linkedin' | 'instagram' | 'facebook'
  tono: string
}): Promise<string> {
  const { negocio, sector, descripcion, clienteIdeal, red, tono } = params

  const instruccionesRed = {
    linkedin: 'Post profesional para LinkedIn. Entre 150-250 palabras. Usa saltos de línea para facilitar la lectura. Sin hashtags excesivos (máximo 3 al final).',
    instagram: 'Post para Instagram. Entre 80-150 palabras. Más cercano y visual. Usa 5-8 hashtags relevantes al final.',
    facebook: 'Post para Facebook. Entre 100-200 palabras. Tono cercano y conversacional. Sin hashtags o máximo 2.',
  }

  const prompt = `Eres un experto en marketing digital español. Crea un post para redes sociales.

EMPRESA: ${negocio}
SECTOR: ${sector}
DESCRIPCIÓN: ${descripcion}
CLIENTE IDEAL: ${clienteIdeal}
RED SOCIAL: ${red}
TONO: ${tono}

INSTRUCCIONES:
${instruccionesRed[red]}
- El post debe aportar valor real, no ser publicidad directa
- Que suene humano, no a IA
- Relacionado con el sector y útil para el cliente ideal
- Varía el tema (consejos, tendencias, errores comunes, casos reales...)

Devuelve SOLO el texto del post, sin comillas ni explicaciones.`

  return await generarTexto(prompt)
}
