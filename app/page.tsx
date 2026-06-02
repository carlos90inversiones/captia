'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECTORES = [
  { label: 'Gestoría / Asesoría', icon: '📊' },
  { label: 'Restaurante / Bar',    icon: '🍽️' },
  { label: 'Clínica / Médico',     icon: '🏥' },
  { label: 'Peluquería / Estética',icon: '✂️' },
  { label: 'Abogado / Notaría',    icon: '⚖️' },
  { label: 'Inmobiliaria',         icon: '🏠' },
  { label: 'Fontanero / Electricista', icon: '🔧' },
  { label: 'Academia / Formación', icon: '🎓' },
  { label: 'Tienda de ropa',       icon: '👗' },
  { label: 'Taller mecánico',      icon: '🚗' },
  { label: 'Gimnasio / Deportes',  icon: '💪' },
  { label: 'Otro',                 icon: '💼' },
]

const TONOS = [
  { value: 'cercano',     label: 'Cercano',     desc: 'Natural, como persona real', emoji: '👋' },
  { value: 'profesional', label: 'Profesional', desc: 'Serio y directo',            emoji: '💼' },
  { value: 'divertido',   label: 'Divertido',   desc: 'Desenfadado y con chispa',   emoji: '🎯' },
]

const FEATURES = [
  { icon: '🔍', title: 'Busca clientes automáticamente', desc: 'Encuentra negocios locales en tu ciudad usando datos de OpenStreetMap y Google Maps.' },
  { icon: '✉️', title: 'Emails personalizados con IA',   desc: 'Gemini redacta cada email adaptado al sector y tono de tu negocio. Sin plantillas genéricas.' },
  { icon: '🔁', title: 'Seguimiento sin esfuerzo',       desc: 'Si no responden a los 4 días, reenvía automáticamente. Tú no haces nada.' },
  { icon: '📱', title: 'Avisos en tiempo real',           desc: 'Cuando alguien responda, recibes notificación inmediata por email y WhatsApp.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: '', sector: '', descripcion: '', ciudad: '',
    cliente_ideal: '', tono: 'cercano', email: '', telefono: '',
  })

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch('/api/negocio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.id) router.push(`/dashboard?id=${data.id}`)
    } finally {
      setGuardando(false)
    }
  }

  const field = "w-full bg-[#0d0d10] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
  const btnPrimary = (disabled: boolean) => ({
    width: '100%' as const,
    background: disabled ? '#27272a' : '#7c3aed',
    color: disabled ? '#52525b' : '#fff',
    fontWeight: 600,
    fontSize: 14,
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    transition: 'background 0.2s',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(124,58,237,0.3)',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column' }}>

      {/* Glows de fondo */}
      <div style={{ position: 'fixed', top: -100, left: '20%', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #18181b', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#7c3aed', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>⚡</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Captia</span>
        </div>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#52525b', borderLeft: '1px solid #27272a', paddingLeft: 12 }}>Clientes automáticos para tu negocio</span>
      </header>

      {/* Contenido principal — 2 columnas en desktop */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 1 }}>

        {/* ── Columna izquierda: propuesta de valor ── */}
        <div className="left-panel" style={{ flex: 1, padding: '60px 60px 60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #18181b' }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 28 }}>
              <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>100% Gratis · Sin tarjeta</span>
            </div>

            <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-1px' }}>
              Consigue clientes<br />
              <span style={{ color: '#a78bfa' }}>mientras duermes</span>
            </h1>
            <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.7, marginBottom: 48, maxWidth: 440 }}>
              Captia busca negocios locales en tu ciudad, les escribe emails personalizados con IA y hace el seguimiento por ti. Tú solo cierras los tratos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7', marginBottom: 3 }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: '#52525b', lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 32, marginTop: 52, paddingTop: 32, borderTop: '1px solid #18181b' }}>
              {[['🏢', '+200', 'negocios contactados'], ['📧', '68%', 'tasa de apertura'], ['⚡', '< 5min', 'para empezar']].map(([icon, num, label]) => (
                <div key={label as string} style={{ textAlign: 'center' as const }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', lineHeight: 1.2 }}>{num}</div>
                  <div style={{ fontSize: 11, color: '#52525b' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: formulario de onboarding ── */}
        <div className="right-panel" style={{ width: 520, flexShrink: 0, padding: '40px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>

          {/* Barra de progreso */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? '#7c3aed' : '#27272a', transition: 'background 0.4s' }} />
            ))}
          </div>

          {/* Card del paso */}
          <div style={{ background: '#111114', border: '1px solid #27272a', borderRadius: 20, padding: '32px 28px' }}>

            {/* ── PASO 0 ── */}
            {step === 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Paso 1 de 4</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>¿A qué te dedicas?</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>La IA necesita entender tu negocio para buscar los clientes correctos.</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Nombre del negocio</label>
                  <input autoFocus type="text" placeholder="Ej: Clínica Dental Martínez"
                    value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className={field} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 8 }}>Sector</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {SECTORES.map(s => (
                      <button key={s.label} onClick={() => setForm(f => ({ ...f, sector: s.label }))}
                        style={{
                          padding: '10px 8px', borderRadius: 10,
                          border: `1px solid ${form.sector === s.label ? '#7c3aed' : '#27272a'}`,
                          background: form.sector === s.label ? 'rgba(124,58,237,0.15)' : '#0d0d10',
                          color: form.sector === s.label ? '#c4b5fd' : '#71717a',
                          fontSize: 11, fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                          transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                        <span style={{ fontSize: 16 }}>{s.icon}</span>
                        <span style={{ lineHeight: 1.3 }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>¿Qué haces exactamente?</label>
                  <textarea rows={2} placeholder="Ej: Somos una clínica dental en Madrid. Hacemos ortodoncia, implantes y revisiones."
                    value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    className={field} style={{ resize: 'none' }} />
                </div>

                <button onClick={() => setStep(1)} disabled={!form.nombre || !form.sector || !form.descripcion}
                  style={btnPrimary(!form.nombre || !form.sector || !form.descripcion)}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ── PASO 1 ── */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Paso 2 de 4</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>¿A quién le vendes?</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Cuanto más concreto seas, mejor encontrará la IA.</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Ciudad donde buscamos clientes</label>
                  <input autoFocus type="text" placeholder="Ej: Madrid, Sevilla, Huelva..."
                    value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                    className={field} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>¿Quién es tu cliente ideal?</label>
                  <textarea rows={3} placeholder="Ej: Restaurantes y hoteles de Madrid que necesiten proveedor de vinos."
                    value={form.cliente_ideal} onChange={e => setForm(f => ({ ...f, cliente_ideal: e.target.value }))}
                    className={field} style={{ resize: 'none' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 8 }}>Tono de los emails</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {TONOS.map(t => (
                      <button key={t.value} onClick={() => setForm(f => ({ ...f, tono: t.value }))}
                        style={{ padding: '12px 8px', borderRadius: 10, border: `1px solid ${form.tono === t.value ? '#7c3aed' : '#27272a'}`, background: form.tono === t.value ? 'rgba(124,58,237,0.15)' : '#0d0d10', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 20 }}>{t.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: form.tono === t.value ? '#c4b5fd' : '#a1a1aa' }}>{t.label}</span>
                        <span style={{ fontSize: 10, color: '#52525b', textAlign: 'center', lineHeight: 1.3 }}>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(0)} style={{ padding: '13px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: 12, color: '#71717a', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                  <button onClick={() => setStep(2)} disabled={!form.ciudad || !form.cliente_ideal}
                    style={{ ...btnPrimary(!form.ciudad || !form.cliente_ideal), width: undefined, flex: 1 }}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2 ── */}
            {step === 2 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Paso 3 de 4</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>¿Cómo te avisamos?</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Te notificamos cuando alguien responda.</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Tu email</label>
                  <input autoFocus type="email" placeholder="tu@empresa.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={field} />
                  <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 4 }}>Los clientes responderán a este email</p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Teléfono <span style={{ color: '#3f3f46', fontWeight: 400 }}>(opcional — avisos WhatsApp)</span></label>
                  <input type="tel" placeholder="612 345 678"
                    value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className={field} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={{ padding: '13px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: 12, color: '#71717a', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                  <button onClick={() => setStep(3)} disabled={!form.email}
                    style={{ ...btnPrimary(!form.email), width: undefined, flex: 1 }}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3 ── */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Paso 4 de 4</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Todo listo 🚀</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>Esto es lo que hará Captia por ti automáticamente:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    { icon: '🔍', title: 'Busca negocios', desc: `Encuentra clientes en ${form.ciudad} vía OpenStreetMap` },
                    { icon: '✉️', title: 'Escribe y manda emails', desc: `IA redacta cada email en tono ${form.tono}` },
                    { icon: '🔁', title: 'Seguimiento automático', desc: 'Si no responden, insiste a los 4 y 11 días' },
                    { icon: '📱', title: 'Te avisa al instante', desc: `Notificación a ${form.email}` },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: '#0d0d10', border: '1px solid #27272a', borderRadius: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: '#52525b' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(2)} style={{ padding: '13px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: 12, color: '#71717a', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                  <button onClick={guardar} disabled={guardando}
                    style={{ flex: 1, background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 14, padding: '13px 0', borderRadius: 12, border: 'none', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {guardando
                      ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Configurando...</>
                      : '⚡ Activar Captia'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#27272a', marginTop: 20 }}>
            Completamente gratis · Sin tarjeta · Sin límites
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  )
}
