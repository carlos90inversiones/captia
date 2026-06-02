'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECTORES = [
  { label: 'Gestoría / Asesoría', icon: '📊' },
  { label: 'Restaurante / Bar', icon: '🍽️' },
  { label: 'Clínica / Médico', icon: '🏥' },
  { label: 'Peluquería / Estética', icon: '✂️' },
  { label: 'Abogado / Notaría', icon: '⚖️' },
  { label: 'Inmobiliaria', icon: '🏠' },
  { label: 'Fontanero / Electricista', icon: '🔧' },
  { label: 'Academia / Formación', icon: '🎓' },
  { label: 'Tienda de ropa', icon: '👗' },
  { label: 'Taller mecánico', icon: '🚗' },
  { label: 'Gimnasio / Deportes', icon: '💪' },
  { label: 'Otro', icon: '💼' },
]

const TONOS = [
  { value: 'cercano', label: 'Cercano', desc: 'Natural, como persona real', emoji: '👋' },
  { value: 'profesional', label: 'Profesional', desc: 'Serio y directo al grano', emoji: '💼' },
  { value: 'divertido', label: 'Divertido', desc: 'Desenfadado y con personalidad', emoji: '🎯' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: '', sector: '', descripcion: '', ciudad: '',
    cliente_ideal: '', tono: 'cercano', email: '', telefono: '',
  })

  const siguiente = () => setStep(s => s + 1)
  const anterior = () => setStep(s => s - 1)

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

  const inputClass = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-900/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-violet-600/30">
              ⚡
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Captia</span>
          </div>
          <p className="text-zinc-500 text-sm">Clientes automáticos para tu negocio</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex-1 relative">
              <div className={`h-1 rounded-full transition-all duration-500 ${
                i < step ? 'bg-violet-500' :
                i === step ? 'bg-violet-500' :
                'bg-zinc-800'
              }`} />
            </div>
          ))}
        </div>

        {/* Card contenedor */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-7 backdrop-blur-sm shadow-xl shadow-black/30">

          {/* PASO 0 — Tu negocio */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Paso 1 de 4</p>
                <h2 className="text-xl font-bold text-white">¿A qué te dedicas?</h2>
                <p className="text-zinc-500 text-sm mt-1">La IA necesita entender tu negocio para buscar los clientes correctos.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre del negocio</label>
                  <input autoFocus type="text" placeholder="Ej: Clínica Dental Martínez"
                    value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Sector</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SECTORES.map(s => (
                      <button key={s.label} onClick={() => setForm(f => ({ ...f, sector: s.label }))}
                        className={`px-2 py-2.5 rounded-xl text-xs font-medium border transition-all text-left flex flex-col gap-1 ${
                          form.sector === s.label
                            ? 'bg-violet-600/20 border-violet-500/60 text-violet-200'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                        }`}>
                        <span className="text-base">{s.icon}</span>
                        <span className="leading-tight">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">¿Qué haces exactamente?</label>
                  <textarea rows={2} placeholder="Ej: Somos una clínica dental en Madrid. Hacemos ortodoncia, implantes y revisiones."
                    value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    className={`${inputClass} resize-none`} />
                </div>
              </div>

              <button onClick={siguiente} disabled={!form.nombre || !form.sector || !form.descripcion}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-violet-600/20 disabled:shadow-none">
                Continuar →
              </button>
            </div>
          )}

          {/* PASO 1 — Tu cliente */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Paso 2 de 4</p>
                <h2 className="text-xl font-bold text-white">¿A quién le vendes?</h2>
                <p className="text-zinc-500 text-sm mt-1">Cuanto más concreto seas, mejor encontrará la IA.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ciudad donde buscamos clientes</label>
                  <input autoFocus type="text" placeholder="Ej: Madrid, Sevilla, Barcelona..."
                    value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                    className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">¿Quién es tu cliente ideal?</label>
                  <textarea rows={3} placeholder="Ej: Restaurantes y hoteles de Madrid que necesiten proveedor de vinos."
                    value={form.cliente_ideal} onChange={e => setForm(f => ({ ...f, cliente_ideal: e.target.value }))}
                    className={`${inputClass} resize-none`} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Tono de los emails</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONOS.map(t => (
                      <button key={t.value} onClick={() => setForm(f => ({ ...f, tono: t.value }))}
                        className={`px-3 py-3 rounded-xl border transition-all text-center flex flex-col items-center gap-1.5 ${
                          form.tono === t.value
                            ? 'bg-violet-600/20 border-violet-500/60'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                        }`}>
                        <span className="text-xl">{t.emoji}</span>
                        <span className={`text-xs font-semibold ${form.tono === t.value ? 'text-violet-200' : 'text-zinc-300'}`}>{t.label}</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={anterior} className="px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Atrás
                </button>
                <button onClick={siguiente} disabled={!form.ciudad || !form.cliente_ideal}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-violet-600/20 disabled:shadow-none">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 — Contacto */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Paso 3 de 4</p>
                <h2 className="text-xl font-bold text-white">¿Cómo te avisamos?</h2>
                <p className="text-zinc-500 text-sm mt-1">Te notificamos cuando un cliente potencial responda.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tu email</label>
                  <input autoFocus type="email" placeholder="tu@empresa.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={inputClass} />
                  <p className="text-xs text-zinc-600 mt-1">Los clientes responderán a este email</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Teléfono <span className="text-zinc-600">(opcional — avisos WhatsApp)</span>
                  </label>
                  <input type="tel" placeholder="612 345 678"
                    value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={anterior} className="px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Atrás
                </button>
                <button onClick={siguiente} disabled={!form.email}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-violet-600/20 disabled:shadow-none">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Resumen */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Paso 4 de 4</p>
                <h2 className="text-xl font-bold text-white">Todo listo 🚀</h2>
                <p className="text-zinc-500 text-sm mt-1">Esto es lo que hará Captia por ti, solo:</p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: '🔍', step: '1', title: 'Busca negocios', desc: `Encuentra clientes en ${form.ciudad} vía OpenStreetMap` },
                  { icon: '✉️', step: '2', title: 'Escribe y manda emails', desc: `La IA redacta cada email en tono ${form.tono}` },
                  { icon: '🔁', step: '3', title: 'Seguimiento automático', desc: 'Si no responden, insiste en los días siguientes' },
                  { icon: '📱', step: '4', title: 'Te avisa al instante', desc: `Notificación a ${form.email}` },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-base flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={anterior} className="px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Atrás
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-600/25 inline-flex items-center justify-center gap-2">
                  {guardando
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Configurando...</>
                    : <><span>⚡</span> Activar Captia</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-700 mt-6">
          Completamente gratis · Sin tarjeta · Sin límites
        </p>
      </div>
    </div>
  )
}
