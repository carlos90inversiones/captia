'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECTORES = [
  'Gestoría / Asesoría', 'Tienda de ropa', 'Restaurante / Bar', 'Clínica dental',
  'Fontanero / Electricista', 'Academia / Formación', 'Peluquería / Estética',
  'Abogado / Notaría', 'Inmobiliaria', 'Taller mecánico', 'Gimnasio / Deportes', 'Otro',
]

const TONOS = [
  { value: 'cercano', label: '😊 Cercano', desc: 'Como si lo escribiera una persona real' },
  { value: 'profesional', label: '💼 Profesional', desc: 'Serio y directo al grano' },
  { value: 'divertido', label: '🎉 Divertido', desc: 'Desenfadado y con personalidad' },
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">⚡ Captia</h1>
        <p className="text-zinc-500 text-sm mt-1">Clientes automáticos para tu negocio</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="flex gap-1.5 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-violet-500' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">¿A qué te dedicas?</h2>
            <p className="text-zinc-500 text-sm mb-6">Cuéntanos sobre tu negocio para que la IA lo entienda bien.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nombre del negocio *</label>
                <input autoFocus type="text" placeholder="Ej: Clínica Dental Martínez"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Sector *</label>
                <div className="flex flex-wrap gap-2">
                  {SECTORES.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, sector: s }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.sector === s ? 'bg-violet-500/20 border-violet-500/60 text-violet-200' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/25'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">¿Qué haces exactamente? *</label>
                <textarea rows={3} placeholder="Ej: Somos una clínica dental en Madrid. Hacemos ortodoncia, implantes y revisiones."
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors resize-none" />
              </div>
            </div>
            <button onClick={siguiente} disabled={!form.nombre || !form.sector || !form.descripcion}
              className="mt-6 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">¿A quién le vendes?</h2>
            <p className="text-zinc-500 text-sm mb-6">Cuanto más concreto, mejor buscará la IA.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ciudad donde buscamos clientes *</label>
                <input autoFocus type="text" placeholder="Ej: Madrid, Sevilla, Barcelona..."
                  value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">¿Quién es tu cliente ideal? *</label>
                <textarea rows={3} placeholder="Ej: Pymes y autónomos de Madrid que necesiten servicios dentales para sus empleados."
                  value={form.cliente_ideal} onChange={e => setForm(f => ({ ...f, cliente_ideal: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tono *</label>
                <div className="space-y-2">
                  {TONOS.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, tono: t.value }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${form.tono === t.value ? 'bg-violet-500/20 border-violet-500/60' : 'bg-zinc-900 border-white/10 hover:border-white/25'}`}>
                      <span className="font-medium text-sm text-zinc-100">{t.label}</span>
                      <span className="text-xs text-zinc-500 ml-2">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={anterior} className="text-zinc-500 hover:text-zinc-300 text-sm px-4">← Atrás</button>
              <button onClick={siguiente} disabled={!form.ciudad || !form.cliente_ideal}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">¿Cómo te avisamos?</h2>
            <p className="text-zinc-500 text-sm mb-6">Te notificamos cuando un cliente potencial responde.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tu email *</label>
                <input autoFocus type="email" placeholder="tu@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Teléfono <span className="text-zinc-600 font-normal normal-case">(avisos WhatsApp)</span></label>
                <input type="tel" placeholder="612 345 678"
                  value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={anterior} className="text-zinc-500 hover:text-zinc-300 text-sm px-4">← Atrás</button>
              <button onClick={siguiente} disabled={!form.email}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Todo listo 🚀</h2>
            <p className="text-zinc-500 text-sm mb-6">Esto es lo que hará Captia por ti automáticamente:</p>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4 mb-6">
              {[
                { icon: '🔍', title: 'Busca clientes en Google Maps', desc: `Encuentra negocios en ${form.ciudad} que puedan necesitar tus servicios` },
                { icon: '✉️', title: 'Escribe y manda emails personalizados', desc: `La IA redacta cada email en tono ${form.tono} con el contexto del destinatario` },
                { icon: '🔁', title: 'Hace seguimiento automático', desc: 'Si no responden, manda 2 seguimientos más en los días siguientes' },
                { icon: '📱', title: 'Te avisa cuando alguien responde', desc: `Notificación inmediata a ${form.email}` },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={anterior} className="text-zinc-500 hover:text-zinc-300 text-sm px-4">← Atrás</button>
              <button onClick={guardar} disabled={guardando}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {guardando
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Configurando...</>
                  : '⚡ Activar Captia'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
