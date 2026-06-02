'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

type Negocio = { id: string; nombre: string; sector: string; descripcion: string; ciudad: string; cliente_ideal: string; tono: string; email: string; telefono: string | null }
type Contacto = { id: string; nombre: string; ciudad: string; sector: string; estado: string; telefono: string | null; web: string | null; email_encontrado: string | null; rating: number | null; ultimo_contacto: string | null }
type Stats = { total: number; nuevos: number; email_enviado: number; seguimiento: number; respondio: number }

const ESTADO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  nuevo:          { label: 'Nuevo',          color: 'bg-zinc-800 text-zinc-300',          dot: 'bg-zinc-500' },
  email_enviado:  { label: 'Email enviado',   color: 'bg-blue-500/15 text-blue-300',       dot: 'bg-blue-400' },
  seguimiento_1:  { label: 'Seguimiento 1',   color: 'bg-amber-500/15 text-amber-300',     dot: 'bg-amber-400' },
  seguimiento_2:  { label: 'Seguimiento 2',   color: 'bg-orange-500/15 text-orange-300',   dot: 'bg-orange-400' },
  respondio:      { label: '✓ Respondió',     color: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  descartado:     { label: 'Descartado',      color: 'bg-red-500/10 text-red-400',         dot: 'bg-red-500' },
}

function DashboardInner() {
  const searchParams = useSearchParams()
  const negocioId = searchParams.get('id')

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, nuevos: 0, email_enviado: 0, seguimiento: 0, respondio: 0 })
  const [buscando,  setBuscando]  = useState(false)
  const [enviando,  setEnviando]  = useState(false)
  const [guardandoAjustes, setGuardandoAjustes] = useState(false)
  const [toast,     setToast]     = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [tab,       setTab]       = useState<'todos' | 'nuevos' | 'respondio'>('todos')
  const [vista,     setVista]     = useState<'dashboard' | 'ajustes'>('dashboard')
  const [formAjustes, setFormAjustes] = useState<Negocio | null>(null)

  const showToast = (tipo: 'ok' | 'error', texto: string) => {
    setToast({ tipo, texto })
    setTimeout(() => setToast(null), 5000)
  }

  const cargarDatos = useCallback(async () => {
    if (!negocioId) return
    const [negRes, contRes] = await Promise.all([
      fetch(`/api/negocio?id=${negocioId}`),
      fetch(`/api/contactos?negocio_id=${negocioId}`),
    ])
    const neg = await negRes.json()
    const cont = await contRes.json()
    setNegocio(neg)
    const lista: Contacto[] = cont.contactos || []
    setContactos(lista)
    setStats({
      total: lista.length,
      nuevos: lista.filter(c => c.estado === 'nuevo').length,
      email_enviado: lista.filter(c => c.estado === 'email_enviado').length,
      seguimiento: lista.filter(c => c.estado.startsWith('seguimiento')).length,
      respondio: lista.filter(c => c.estado === 'respondio').length,
    })
  }, [negocioId])

  useEffect(() => { cargarDatos() }, [cargarDatos])
  useEffect(() => { if (negocio) setFormAjustes(negocio) }, [negocio])

  const buscarClientes = async () => {
    if (!negocioId) return
    setBuscando(true)
    try {
      const res = await fetch('/api/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocio_id: negocioId }),
      })
      const data = await res.json()
      showToast('ok', `${data.nuevos} nuevos contactos encontrados`)
      await cargarDatos()
    } catch {
      showToast('error', 'Error al buscar. Inténtalo de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  const enviarEmails = async () => {
    if (!negocioId) return
    setEnviando(true)
    try {
      const res = await fetch('/api/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocio_id: negocioId }),
      })
      const data = await res.json()
      showToast('ok', `${data.enviados} emails enviados`)
      await cargarDatos()
    } catch {
      showToast('error', 'Error al enviar emails.')
    } finally {
      setEnviando(false)
    }
  }

  const guardarAjustes = async () => {
    if (!formAjustes || !negocioId) return
    setGuardandoAjustes(true)
    try {
      const res = await fetch('/api/negocio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formAjustes, id: negocioId }),
      })
      const data = await res.json()
      if (data.ok) {
        await cargarDatos()
        showToast('ok', 'Ajustes guardados correctamente')
        setVista('dashboard')
      } else throw new Error(data.error)
    } catch {
      showToast('error', 'Error al guardar. Inténtalo de nuevo.')
    } finally {
      setGuardandoAjustes(false)
    }
  }

  const filtrados = contactos.filter(c => {
    if (tab === 'nuevos') return c.estado === 'nuevo'
    if (tab === 'respondio') return c.estado === 'respondio'
    return true
  })

  if (!negocioId) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-500 mb-4">No hay negocio seleccionado</p>
        <a href="/" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">← Configurar negocio</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-2 ${
          toast.tipo === 'ok'
            ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950 border-red-500/30 text-red-300'
        }`}>
          <span>{toast.tipo === 'ok' ? '✓' : '✕'}</span>
          {toast.texto}
        </div>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-56 border-r border-zinc-800/60 flex flex-col p-4 flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-1 mb-8">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-sm shadow-md shadow-violet-600/30">⚡</div>
            <span className="font-bold text-white text-base">Captia</span>
          </div>

          <nav className="space-y-0.5 flex-1">
            <button onClick={() => setVista('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'dashboard' ? 'bg-zinc-800/70 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>
              <span className="text-zinc-400">📊</span> Dashboard
            </button>
            <button disabled className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-600 text-sm cursor-not-allowed">
              <span>👥</span> Contactos
            </button>
            <button disabled className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-600 text-sm cursor-not-allowed">
              <span>✉️</span> Emails
            </button>
            <button onClick={() => setVista('ajustes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'ajustes' ? 'bg-zinc-800/70 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>
              <span>⚙️</span> Ajustes
            </button>
          </nav>

          {negocio && (
            <div className="border-t border-zinc-800 pt-4 mt-4">
              <div className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-xs font-semibold text-zinc-100 truncate">{negocio.nombre}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{negocio.ciudad}</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Topbar */}
          <div className="border-b border-zinc-800/60 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-sm z-10">
            <div>
              <h1 className="text-base font-bold text-white">{vista === 'ajustes' ? 'Ajustes del negocio' : 'Dashboard'}</h1>
              {negocio && <p className="text-xs text-zinc-500 mt-0.5">{negocio.sector} · Tono {negocio.tono}</p>}
            </div>
            {vista === 'dashboard' && (
              <button
                onClick={buscando ? undefined : buscarClientes}
                disabled={buscando || enviando}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all inline-flex items-center gap-2 shadow-lg shadow-violet-600/20">
                {buscando
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando...</>
                  : 'Buscar clientes'}
              </button>
            )}
            {vista === 'ajustes' && (
              <div className="flex gap-2">
                <button onClick={() => setVista('dashboard')}
                  className="border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 px-4 py-2 rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={guardarAjustes} disabled={guardandoAjustes}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all inline-flex items-center gap-2">
                  {guardandoAjustes
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                    : '✓ Guardar cambios'}
                </button>
              </div>
            )}
          </div>

          {/* ── Vista Ajustes ── */}
          {vista === 'ajustes' && formAjustes && (
            <div className="px-8 py-6 max-w-2xl">
              <p className="text-xs text-zinc-500 mb-6">Los cambios se aplican a los próximos emails que genere la IA. Los ya enviados no se modifican.</p>

              {([
                { key: 'nombre',       label: 'Nombre del negocio',    placeholder: 'Ej: Marsof Technology',     type: 'text',     multi: false },
                { key: 'sector',       label: 'Sector',                placeholder: 'Ej: Tecnología, Fontanero…', type: 'text',    multi: false },
                { key: 'descripcion',  label: 'Descripción',           placeholder: 'Qué hacéis exactamente…',   type: 'text',     multi: true  },
                { key: 'ciudad',       label: 'Ciudad de búsqueda',    placeholder: 'Ej: Madrid, Sevilla…',      type: 'text',     multi: false },
                { key: 'cliente_ideal',label: 'Cliente ideal',         placeholder: 'Quiénes son tus clientes…', type: 'text',     multi: true  },
                { key: 'email',        label: 'Email de respuestas',   placeholder: 'tu@empresa.com',            type: 'email',    multi: false },
                { key: 'telefono',     label: 'Teléfono WhatsApp',     placeholder: '612 345 678 (opcional)',    type: 'tel',      multi: false },
              ] as const).map(({ key, label, placeholder, type, multi }) => (
                <div key={key} className="mb-5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">{label}</label>
                  {multi ? (
                    <textarea rows={3} placeholder={placeholder}
                      value={(formAjustes as Record<string, string | null>)[key] ?? ''}
                      onChange={e => setFormAjustes(f => f ? { ...f, [key]: e.target.value } : f)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none font-sans" />
                  ) : (
                    <input type={type} placeholder={placeholder}
                      value={(formAjustes as Record<string, string | null>)[key] ?? ''}
                      onChange={e => setFormAjustes(f => f ? { ...f, [key]: e.target.value } : f)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                  )}
                </div>
              ))}

              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Tono de emails</label>
                <div className="flex gap-3">
                  {[
                    { v: 'cercano',     l: 'Cercano',     e: '👋' },
                    { v: 'profesional', l: 'Profesional', e: '💼' },
                    { v: 'divertido',   l: 'Divertido',   e: '🎯' },
                  ].map(t => (
                    <button key={t.v} onClick={() => setFormAjustes(f => f ? { ...f, tono: t.v } : f)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formAjustes.tono === t.v
                          ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                      }`}>
                      <span className="text-lg">{t.e}</span>
                      <span>{t.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Vista Dashboard ── */}
          {vista === 'dashboard' && (
          <div className="px-8 py-6 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total', value: stats.total, color: 'text-white' },
                { label: 'Nuevos', value: stats.nuevos, color: 'text-zinc-300' },
                { label: 'Emails enviados', value: stats.email_enviado, color: 'text-blue-400' },
                { label: 'En seguimiento', value: stats.seguimiento, color: 'text-amber-400' },
                { label: 'Respondieron', value: stats.respondio, color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA enviar */}
            {stats.nuevos > 0 && (
              <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-200">
                    {stats.nuevos} contacto{stats.nuevos > 1 ? 's' : ''} listo{stats.nuevos > 1 ? 's' : ''} para contactar
                  </p>
                  <p className="text-xs text-blue-400/60 mt-0.5">La IA escribirá un email personalizado para cada uno</p>
                </div>
                <button onClick={enviarEmails} disabled={enviando || buscando}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all inline-flex items-center gap-2 flex-shrink-0 shadow-lg shadow-blue-600/20">
                  {enviando
                    ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                    : <><span>✉️</span>Enviar emails</>}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-zinc-800">
              {([
                { key: 'todos' as const, label: 'Todos', count: stats.total },
                { key: 'nuevos' as const, label: 'Nuevos', count: stats.nuevos },
                { key: 'respondio' as const, label: 'Respondieron', count: stats.respondio },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px inline-flex items-center gap-1.5 ${
                    tab === t.key
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    tab === t.key ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Lista de contactos */}
            {filtrados.length === 0 ? (
              <div className="border border-zinc-800 border-dashed rounded-xl py-20 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-zinc-300 font-semibold mb-1">Sin contactos aún</p>
                <p className="text-zinc-600 text-sm mb-6">Pulsa "Buscar clientes" y la IA encontrará negocios en tu ciudad</p>
                <button onClick={buscarClientes} disabled={buscando}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 inline-flex items-center gap-2">
                  {buscando
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando...</>
                    : 'Buscar ahora'}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtrados.map(c => {
                  const cfg = ESTADO_CONFIG[c.estado] || ESTADO_CONFIG.nuevo
                  return (
                    <div key={c.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all group">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-100">{decodeHtml(c.nombre)}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                          {c.rating && <span className="text-[10px] text-amber-400">★ {c.rating}</span>}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {[
                            c.ciudad,
                            c.sector?.length > 30 ? c.sector.slice(0, 30) + '…' : c.sector,
                            c.telefono,
                          ].filter(Boolean).join(' · ')}
                          {c.web && <> · <a href={c.web} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">{c.web.replace(/^https?:\/\//, '').split('/')[0]}</a></>}
                        </p>
                      </div>
                      {c.email_encontrado && (
                        <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg font-mono flex-shrink-0">
                          {c.email_encontrado}
                        </span>
                      )}
                      {c.ultimo_contacto && (
                        <span className="text-xs text-zinc-600 flex-shrink-0">
                          {new Date(c.ultimo_contacto).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          )} {/* fin vista dashboard */}
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  )
}
