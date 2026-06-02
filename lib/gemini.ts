import { GoogleGenerativeAI } from '@google/generative-ai'

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')
  return new GoogleGenerativeAI(apiKey)
}

export async function generarTexto(prompt: string): Promise<string> {
  const genAI = getGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
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

  const texto = await generarTexto(prompt)
  const limpio = texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(limpio)
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
