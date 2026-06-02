'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Tipos ─────────────────────────────── */
type MsgRole = 'bot' | 'user'
interface Msg { id: number; role: MsgRole; text: string; typing?: boolean }

type InputMode =
  | { type: 'text';    placeholder: string; multiline?: boolean }
  | { type: 'web-or-text' }
  | { type: 'sectors' }
  | { type: 'tonos' }
  | { type: 'confirm' }
  | { type: 'skip';    placeholder: string }
  | { type: 'done' }

interface Step {
  botMsg:  string
  field:   keyof Form | null
  input:   InputMode
  next?:   (val: string, form: Form) => string   // mensaje de confirmación bot
}

/* ─── Datos ─────────────────────────────── */
const SECTORES = [
  { label: 'Gestoría / Asesoría',       icon: '📊' },
  { label: 'Restaurante / Bar',          icon: '🍽️' },
  { label: 'Clínica / Médico',           icon: '🏥' },
  { label: 'Peluquería / Estética',      icon: '✂️' },
  { label: 'Abogado / Notaría',          icon: '⚖️' },
  { label: 'Inmobiliaria',               icon: '🏠' },
  { label: 'Fontanero / Electricista',   icon: '🔧' },
  { label: 'Academia / Formación',       icon: '🎓' },
  { label: 'Tienda de ropa',             icon: '👗' },
  { label: 'Taller mecánico',            icon: '🚗' },
  { label: 'Gimnasio / Deportes',        icon: '💪' },
  { label: 'Otro',                       icon: '💼' },
]
const TONOS = [
  { value: 'cercano',     label: 'Cercano',     emoji: '👋', desc: 'Natural y directo' },
  { value: 'profesional', label: 'Profesional', emoji: '💼', desc: 'Serio y formal'   },
  { value: 'divertido',   label: 'Divertido',   emoji: '🎯', desc: 'Con energía'      },
]

/* ─── Pasos del chat ─────────────────────── */
const STEPS: Step[] = [
  {
    botMsg: '¡Hola! Soy Captia ⚡\n\nEn menos de 2 minutos te configuro para recibir clientes automáticamente.\n\n¿Cómo se llama tu negocio?',
    field:  'nombre',
    input:  { type: 'text', placeholder: 'Ej: Marsof Technology' },
    next:   (v) => `Genial, **${v}**. ¿En qué sector trabajáis?`,
  },
  {
    botMsg: '', // se rellena con next del anterior
    field:  'sector',
    input:  { type: 'text', placeholder: 'Ej: Fontanero, Gestoría, Clínica dental, Agencia de marketing...' },
    next:   (v) => `Perfecto. ¿Tenéis página web? Si me la pegas la analizo con IA y entiendo vuestro negocio automáticamente.\n\nSi no tenéis web, escribe directamente qué hacéis en **${v}**.`,
  },
  {
    botMsg: '',
    field:  'descripcion',
    input:  { type: 'web-or-text' },
    next:   () => '¿En qué ciudad queréis buscar clientes?',
  },
  {
    botMsg: '',
    field:  'ciudad',
    input:  { type: 'text', placeholder: 'Ej: Madrid, Sevilla, Huelva...' },
    next:   (v) => `Buscaremos en **${v}**. ¿Y quién es vuestro cliente ideal? ¿Qué tipo de negocios?`,
  },
  {
    botMsg: '',
    field:  'cliente_ideal',
    input:  { type: 'text', placeholder: 'Ej: Farmacia, Restaurante, Gestoría, Taller mecánico (1-2 palabras mejor)', multiline: true },
    next:   () => '¿Cómo quieres que suenen los emails que envía la IA?',
  },
  {
    botMsg: '',
    field:  'tono',
    input:  { type: 'tonos' },
    next:   (v, f) => `Emails en tono **${v}**, perfecto.\n\n¿A qué email te mando las respuestas de los clientes?`,
  },
  {
    botMsg: '',
    field:  'email',
    input:  { type: 'text', placeholder: 'tu@empresa.com' },
    next:   () => '¿Tienes WhatsApp donde avisarte cuando alguien responda? (puedes saltar esto)',
  },
  {
    botMsg: '',
    field:  'telefono',
    input:  { type: 'skip', placeholder: '612 345 678' },
    next:   (v) => v
      ? `Perfecto, te aviso en el **${v}**.\n\n¡Ya tengo todo lo que necesito! ¿Activamos Captia?`
      : '¡Ya tengo todo lo que necesito! ¿Activamos Captia? 🚀',
  },
  {
    botMsg: '',
    field:  null,
    input:  { type: 'done' },
  },
]

/* ─── Form types ─────────────────────────── */
interface Form {
  nombre: string; sector: string; descripcion: string
  ciudad: string; cliente_ideal: string; tono: string
  email: string;  telefono: string
}

/* ─── Helpers ────────────────────────────── */
let msgId = 0
const newMsg = (role: MsgRole, text: string, typing = false): Msg =>
  ({ id: ++msgId, role, text, typing })

/* ─── Componente principal ───────────────── */
export default function ChatOnboarding() {
  const router  = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const [msgs,     setMsgs]     = useState<Msg[]>([])
  const [step,     setStep]     = useState(0)
  const [input,    setInput]    = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const [guardando,   setGuardando]   = useState(false)
  const [analizando,  setAnalizando]  = useState(false)
  const [showMagic, setShowMagic] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent]   = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [form,     setForm]     = useState<Form>({
    nombre: '', sector: '', descripcion: '', ciudad: '',
    cliente_ideal: '', tono: 'cercano', email: '', telefono: '',
  })

  /* Scroll al fondo en cada mensaje nuevo */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, botTyping])

  /* Mensaje inicial */
  useEffect(() => {
    setTimeout(() => {
      setBotTyping(true)
      setTimeout(() => {
        setBotTyping(false)
        setMsgs([newMsg('bot', STEPS[0].botMsg)])
      }, 1200)
    }, 400)
  }, [])

  /* ── Enviar respuesta del usuario ── */
  const sendAnswer = (value: string, displayValue?: string) => {
    if (!value.trim() && STEPS[step].input.type !== 'skip') return
    const display = displayValue || value

    // Mensaje del usuario
    const userMsg = newMsg('user', display || '(sin teléfono)')
    setMsgs(prev => [...prev, userMsg])

    // Actualizar form
    const field = STEPS[step].field
    const newForm = field ? { ...form, [field]: value } : form
    if (field) setForm(newForm)
    setInput('')

    // Mostrar siguiente mensaje del bot
    const currentStep = STEPS[step]
    const nextStepIdx = step + 1
    if (nextStepIdx >= STEPS.length) return

    const botText = currentStep.next?.(value, newForm) || STEPS[nextStepIdx].botMsg

    setBotTyping(true)
    const delay = botText.length > 80 ? 1400 : 900
    setTimeout(() => {
      setBotTyping(false)
      setMsgs(prev => [...prev, newMsg('bot', botText)])
      setStep(nextStepIdx)
      setTimeout(() => (inputRef.current as HTMLElement)?.focus(), 100)
    }, delay)
  }

  /* ── Analizar web con IA ── */
  const isURL = (s: string) =>
    /^(https?:\/\/)|(www\.)|(\.(com|es|net|org|io|eu|co|info|biz)\b)/i.test(s.trim())

  const sendWebOrText = async (value: string) => {
    if (!value.trim()) return
    setMsgs(prev => [...prev, newMsg('user', value)])
    setInput('')

    if (isURL(value)) {
      // Analizar web con IA
      setAnalizando(true)
      setBotTyping(true)
      setTimeout(() => {
        setBotTyping(false)
        setMsgs(prev => [...prev, newMsg('bot', '🔍 Analizando tu web con IA...')])
        setBotTyping(true)
      }, 600)

      try {
        const res  = await fetch('/api/analizar-web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        })
        const data = await res.json()
        setAnalizando(false)
        setBotTyping(false)

        if (data.error || !data.descripcion) throw new Error(data.error || 'sin resultado')

        const desc = data.descripcion
        const newForm = { ...form, descripcion: desc }
        setForm(newForm)

        const nextStepIdx = step + 1
        const botText = `✅ Perfecto, ya entendí vuestro negocio:\n\n_"${desc}"_\n\n${STEPS[step].next?.(desc, newForm) || ''}`
        setBotTyping(true)
        setTimeout(() => {
          setBotTyping(false)
          setMsgs(prev => [...prev, newMsg('bot', botText)])
          setStep(nextStepIdx)
        }, 1000)
      } catch {
        setAnalizando(false)
        setBotTyping(false)
        setMsgs(prev => [...prev, newMsg('bot', '❌ No pude acceder a esa web. ¿Me describes tú directamente qué hacéis?')])
        // El usuario puede escribir manualmente (mismo step, pero ya con tipo texto)
      }
    } else {
      // Texto manual — flujo normal
      const newForm = { ...form, descripcion: value }
      setForm(newForm)
      const nextStepIdx = step + 1
      const botText = STEPS[step].next?.(value, newForm) || ''
      setBotTyping(true)
      const delay = botText.length > 80 ? 1400 : 900
      setTimeout(() => {
        setBotTyping(false)
        setMsgs(prev => [...prev, newMsg('bot', botText)])
        setStep(nextStepIdx)
        setTimeout(() => (inputRef.current as HTMLElement)?.focus(), 100)
      }, delay)
    }
  }

  /* ── Activar Captia ── */
  const enviarMagicLink = async () => {
    if (!magicEmail.includes('@')) return
    setMagicLoading(true)
    try {
      await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      })
      setMagicSent(true)
    } catch { /* show sent anyway */ setMagicSent(true) }
    finally { setMagicLoading(false) }
  }

  const activar = async () => {
    setGuardando(true)
    setMsgs(prev => [...prev, newMsg('bot', '⚡ Configurando tu cuenta...')])
    try {
      const res  = await fetch('/api/negocio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.id) router.push(`/dashboard?id=${data.id}`)
    } catch {
      setMsgs(prev => [...prev, newMsg('bot', '❌ Algo falló. Recarga la página e inténtalo de nuevo.')])
      setGuardando(false)
    }
  }

  const currentInput = STEPS[step]?.input

  /* ── Render ── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #05050a; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink   { 0%,80%,100% { opacity:0; } 40% { opacity:1; } }
        @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes glow-pulse { 0%,100% { opacity:.15; } 50% { opacity:.28; } }

        .root {
          height: 100dvh;
          display: flex; flex-direction: column;
          background: #05050a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative; overflow: hidden;
        }

        /* Fondos */
        .bg-blob {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          animation: glow-pulse 6s ease-in-out infinite;
        }
        .bg-blob-1 { width:600px; height:600px; top:-200px; left:-150px;
          background: radial-gradient(circle, rgba(124,58,237,.22) 0%, transparent 65%); }
        .bg-blob-2 { width:500px; height:500px; bottom:-200px; right:-100px;
          background: radial-gradient(circle, rgba(79,70,229,.14) 0%, transparent 65%); }
        .bg-grid {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
          background-size: 52px 52px;
        }

        /* Header */
        .header {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          background: rgba(5,5,10,.85);
          backdrop-filter: blur(16px);
          position: relative; z-index: 10; flex-shrink: 0;
        }
        .logo-box {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 9px; display: flex; align-items: center;
          justify-content: center; font-size: 16px;
          box-shadow: 0 0 18px rgba(124,58,237,.55);
          animation: float 3.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .logo-name { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -.4px; }
        .header-sep { width: 1px; height: 18px; background: rgba(255,255,255,.1); margin: 0 4px; }
        .header-tag { font-size: 12px; color: #52525b; }
        .header-badge {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(124,58,237,.1); border: 1px solid rgba(124,58,237,.22);
          border-radius: 99px; padding: 4px 12px;
          font-size: 11px; color: #a78bfa; font-weight: 600;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,.7);
        }

        /* Chat área */
        .chat-area {
          flex: 1; overflow-y: auto; padding: 28px 0; position: relative; z-index: 1;
          scroll-behavior: smooth;
        }
        .chat-area::-webkit-scrollbar { width: 4px; }
        .chat-area::-webkit-scrollbar-track { background: transparent; }
        .chat-area::-webkit-scrollbar-thumb { background: #27272a; border-radius: 99px; }

        .chat-inner {
          max-width: 720px; margin: 0 auto; padding: 0 20px;
          display: flex; flex-direction: column; gap: 16px;
        }

        /* Burbujas */
        .bubble-row { display: flex; gap: 10px; animation: fadeUp .35s ease both; }
        .bubble-row.user  { flex-direction: row-reverse; }

        .avatar {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          box-shadow: 0 0 12px rgba(124,58,237,.4);
          margin-top: 2px;
        }
        .avatar.user-av {
          background: linear-gradient(135deg, #27272a, #3f3f46);
          box-shadow: none; font-size: 13px;
        }

        .bubble {
          max-width: 78%; padding: 12px 16px;
          border-radius: 18px; font-size: 14px; line-height: 1.65;
          white-space: pre-line;
        }
        .bubble.bot {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          color: #e4e4e7;
          border-top-left-radius: 4px;
        }
        .bubble.bot strong { color: #a78bfa; font-weight: 600; }
        .bubble.user {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff; border-top-right-radius: 4px;
          box-shadow: 0 4px 16px rgba(124,58,237,.3);
        }

        /* Typing indicator */
        .typing-row { display: flex; gap: 10px; animation: fadeUp .25s ease both; }
        .typing-bubble {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          border-radius: 18px; border-top-left-radius: 4px;
          padding: 14px 18px; display: flex; gap: 5px; align-items: center;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%; background: #52525b;
          animation: blink 1.4s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: .2s; }
        .dot:nth-child(3) { animation-delay: .4s; }

        /* Zona de input */
        .input-zone {
          border-top: 1px solid rgba(255,255,255,.06);
          background: rgba(5,5,10,.9); backdrop-filter: blur(16px);
          padding: 16px 20px 20px; position: relative; z-index: 10;
          flex-shrink: 0;
        }
        .input-inner { max-width: 720px; margin: 0 auto; }

        /* Input de texto */
        .text-form { display: flex; gap: 10px; align-items: flex-end; }
        .text-input {
          flex: 1; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px; padding: 13px 16px;
          font-size: 14px; color: #f4f4f5; font-family: inherit;
          outline: none; resize: none; transition: all .2s;
          line-height: 1.5;
        }
        .text-input::placeholder { color: #3f3f46; }
        .text-input:focus {
          border-color: rgba(124,58,237,.5);
          background: rgba(124,58,237,.04);
          box-shadow: 0 0 0 3px rgba(124,58,237,.12);
        }
        .send-btn {
          width: 44px; height: 44px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(124,58,237,.4);
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.07);
          box-shadow: 0 6px 20px rgba(124,58,237,.55);
        }
        .send-btn:disabled { opacity: .35; cursor: not-allowed; transform: none; }

        /* Grid de sectores */
        .sectors-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        .sector-btn {
          padding: 10px 8px; border-radius: 11px; cursor: pointer;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.03);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          transition: all .15s; font-family: inherit;
        }
        .sector-btn:hover {
          border-color: rgba(124,58,237,.4);
          background: rgba(124,58,237,.08);
          transform: translateY(-1px);
        }
        .s-emoji { font-size: 20px; line-height: 1; }
        .s-label { font-size: 10px; color: #71717a; font-weight: 500; text-align: center; line-height: 1.3; }

        /* Tonos */
        .tonos-row { display: flex; gap: 10px; }
        .tono-btn {
          flex: 1; padding: 14px 10px; border-radius: 13px; cursor: pointer;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.03);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          transition: all .15s; font-family: inherit;
        }
        .tono-btn:hover {
          border-color: rgba(124,58,237,.4);
          background: rgba(124,58,237,.08);
          transform: translateY(-1px);
        }
        .t-emoji { font-size: 24px; }
        .t-name  { font-size: 13px; font-weight: 700; color: #e4e4e7; }
        .t-desc  { font-size: 10px; color: #52525b; text-align: center; }

        /* Skip */
        .skip-form { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
        .skip-btn {
          padding: 12px 18px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.08);
          background: transparent; color: #52525b;
          font-size: 13px; cursor: pointer; transition: all .2s; font-family: inherit;
          white-space: nowrap; flex-shrink: 0;
        }
        .skip-btn:hover { border-color: rgba(255,255,255,.18); color: #a1a1aa; }

        /* CTA final */
        .cta-btn {
          width: 100%; padding: 16px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff; font-size: 16px; font-weight: 800; cursor: pointer;
          transition: all .2s; font-family: inherit; letter-spacing: -.3px;
          box-shadow: 0 6px 28px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .cta-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(124,58,237,.6), inset 0 1px 0 rgba(255,255,255,.12);
        }
        .cta-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,.25);
          border-top-color: #fff;
          animation: spin .65s linear infinite;
        }

        @media (max-width: 600px) {
          .sectors-grid { grid-template-columns: repeat(3,1fr); }
          .header-badge { display: none; }
        }
      `}</style>

      <div className="root">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-grid" />

        {/* ── Header ── */}
        <header className="header">
          <div className="logo-box">⚡</div>
          <span className="logo-name">Captia</span>
          <div className="header-sep" />
          <span className="header-tag">Clientes automáticos para tu negocio</span>
          <div className="header-badge">
            <span className="live-dot" />
            100% Gratis
          </div>
          <button onClick={() => { setShowMagic(v => !v); setMagicSent(false); setMagicEmail('') }}
            style={{ marginLeft: 12, background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#71717a', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#c4b5fd' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#71717a' }}>
            Ya tengo cuenta
          </button>
        </header>

        {/* Magic link panel */}
        {showMagic && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(139,92,246,.04)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, backdropFilter: 'blur(16px)' }}>
            {magicSent ? (
              <p style={{ fontSize: 13.5, color: '#6ee7b7', margin: 0 }}>✓ Revisa tu email — te hemos enviado el enlace de acceso a tu panel.</p>
            ) : (
              <>
                <span style={{ fontSize: 13, color: '#71717a', whiteSpace: 'nowrap' }}>Acceder con tu email:</span>
                <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') enviarMagicLink() }}
                  placeholder="tu@empresa.com"
                  style={{ flex: 1, maxWidth: 280, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 12px', fontSize: 13.5, color: '#f4f4f5', outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={enviarMagicLink} disabled={magicLoading || !magicEmail.includes('@')}
                  style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: magicLoading || !magicEmail.includes('@') ? 0.5 : 1 }}>
                  {magicLoading ? '...' : 'Enviar enlace →'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Chat ── */}
        <div className="chat-area">
          <div className="chat-inner">

            {msgs.map(m => (
              <div key={m.id} className={`bubble-row ${m.role}`}>
                <div className={`avatar ${m.role === 'user' ? 'user-av' : ''}`}>
                  {m.role === 'bot' ? '⚡' : '👤'}
                </div>
                <div
                  className={`bubble ${m.role}`}
                  dangerouslySetInnerHTML={{
                    __html: m.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            ))}

            {botTyping && (
              <div className="typing-row">
                <div className="avatar">⚡</div>
                <div className="typing-bubble">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input zone ── */}
        {(!botTyping || analizando) && currentInput && (
          <div className="input-zone">
            <div className="input-inner">

              {/* Texto / textarea */}
              {(currentInput.type === 'text') && (
                <form className="text-form" onSubmit={e => { e.preventDefault(); sendAnswer(input) }}>
                  {currentInput.multiline ? (
                    <textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      className="text-input" rows={2}
                      placeholder={currentInput.placeholder}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(input) } }}
                      autoFocus
                    />
                  ) : (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      className="text-input" type="text"
                      placeholder={currentInput.placeholder}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      autoFocus
                    />
                  )}
                  <button className="send-btn" type="submit" disabled={!input.trim()}>↑</button>
                </form>
              )}

              {/* Web o texto manual */}
              {currentInput.type === 'web-or-text' && (
                <form className="text-form" onSubmit={e => { e.preventDefault(); sendWebOrText(input) }}>
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className="text-input" rows={2}
                    placeholder="https://tuempresa.com  —  o escribe directamente qué hacéis"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWebOrText(input) } }}
                    disabled={analizando}
                    autoFocus
                  />
                  <button className="send-btn" type="submit" disabled={!input.trim() || analizando}>
                    {analizando ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '↑'}
                  </button>
                </form>
              )}

              {/* Sectores */}
              {currentInput.type === 'sectors' && (
                <div className="sectors-grid">
                  {SECTORES.map(s => (
                    <button key={s.label} className="sector-btn"
                      onClick={() => sendAnswer(s.label, `${s.icon} ${s.label}`)}>
                      <span className="s-emoji">{s.icon}</span>
                      <span className="s-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tonos */}
              {currentInput.type === 'tonos' && (
                <div className="tonos-row">
                  {TONOS.map(t => (
                    <button key={t.value} className="tono-btn"
                      onClick={() => sendAnswer(t.value, `${t.emoji} ${t.label}`)}>
                      <span className="t-emoji">{t.emoji}</span>
                      <span className="t-name">{t.label}</span>
                      <span className="t-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Skip (teléfono opcional) */}
              {currentInput.type === 'skip' && (
                <form className="text-form skip-form" onSubmit={e => { e.preventDefault(); sendAnswer(input) }}>
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    className="text-input" type="tel"
                    placeholder={currentInput.placeholder}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    autoFocus
                  />
                  <button className="send-btn" type="submit" disabled={!input.trim()}>↑</button>
                  <button type="button" className="skip-btn"
                    onClick={() => sendAnswer('', 'Sin teléfono por ahora')}>
                    Saltar →
                  </button>
                </form>
              )}

              {/* Done — CTA */}
              {currentInput.type === 'done' && (
                <button className="cta-btn" disabled={guardando} onClick={activar}>
                  {guardando
                    ? <><span className="spinner" /> Configurando tu cuenta...</>
                    : '⚡ Activar Captia — empezar a conseguir clientes'}
                </button>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  )
}
