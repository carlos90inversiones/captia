'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Negocio = { id: string; nombre: string; sector: string; ciudad: string; cliente_ideal: string; tono: string; email: string }
type Contacto = { id: string; nombre: string; ciudad: string; sector: string; estado: string; telefono: string | null; web: string | null; email_encontrado: string | null; rating: number | null; ultimo_contacto: string | null }
type Stats = { total: number; nuevos: number; email_enviado: number; seguimiento: number; respondio: number }

const ESTADO_BADGE: Record<string, string> = {
  nuevo: 'bg-zinc-700 text-zinc-300',
  email_enviado: 'bg-blue-500/20 text-blue-300',
  seguimiento_1: 'bg-amber-500/20 text-amber-300',
  seguimiento_2: 'bg-orange-500/20 text-orange-300',
  respondio: 'bg-emerald-500/20 text-emerald-300',
  descartado: 'bg-red-500/10 text-red-400',
}

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  email_enviado: 'Email enviado',
  seguimiento_1: 'Seguimiento 1',
  seguimiento_2: 'Seguimiento 2',
  respondio: '✓ Respondió',
  descartado: 'Descartado',
}

function DashboardInner() {
  const searchParams = useSearchParams()
  const negocioId = searchParams.get('id')

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, nuevos: 0, email_enviado: 0, seguimiento: 0, respondio: 0 })
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [tab, setTab] = useState<'todos' | 'nuevos' | 'respondio'>('todos')

  const mostrarMensaje = (tipo: 'ok' | 'error', texto: string) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 5000)
  }

  const cargarDatos = useCallback(async () => {
    if (!negocioId) return
    const [negRes, contactosRes] = await Promise.all([
      fetch(`/api/negocio?id=${negocioId}`),
      fetch(`/api/contactos?negocio_id=${negocioId}`),
    ])
    const neg = await negRes.json()
    const cont = await contactosRes.json()
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
      mostrarMensaje('ok', `✅ ${data.nuevos} nuevos contactos encontrados en Google Maps`)
      await cargarDatos()
    } catch {
      mostrarMensaje('error', 'Error al buscar. Verifica que GOOGLE_MAPS_API_KEY esté configurada.')
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
      mostrarMensaje('ok', `✉️ ${data.enviados} emails enviados automáticamente`)
      await cargarDatos()
    } catch {
      mostrarMensaje('error', 'Error al enviar emails.')
    } finally {
      setEnviando(false)
    }
  }

  const filtrados = contactos.filter(c => {
    if (tab === 'nuevos') return c.estado === 'nuevo'
    if (tab === 'respondio') return c.estado === 'respondio'
    return true
  })

  if (!negocioId) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-500">
      <a href="/" className="text-violet-400 hover:underline">← Configura tu negocio primero</a>
    </div>
  )

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${mensaje.tipo === 'ok' ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' : 'bg-red-950 border-red-500/30 text-red-300'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold text-white">Captia</h1>
          </div>
          {negocio && (
            <p className="text-zinc-500 text-sm">{negocio.nombre} · {negocio.ciudad} · Tono {negocio.tono}</p>
          )}
        </div>

        {/* Botón principal */}
        <button
          onClick={buscando ? undefined : buscarClientes}
          disabled={buscando || enviando}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60 inline-flex items-center gap-2 text-sm shadow-lg shadow-violet-500/20"
        >
          {buscando ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando clientes...</>
          ) : '🔍 Buscar clientes'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Nuevos', value: stats.nuevos, color: 'text-zinc-300' },
          { label: 'Emails enviados', value: stats.email_enviado, color: 'text-blue-300' },
          { label: 'En seguimiento', value: stats.seguimiento, color: 'text-amber-300' },
          { label: 'Respondieron', value: stats.respondio, color: 'text-emerald-300' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {stats.nuevos > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-blue-200 font-semibold text-sm">{stats.nuevos} contactos nuevos listos para contactar</p>
            <p className="text-blue-400/70 text-xs mt-0.5">La IA escribirá un email personalizado para cada uno</p>
          </div>
          <button
            onClick={enviarEmails}
            disabled={enviando || buscando}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {enviando ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Enviando...</> : '✉️ Enviar emails automáticos'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'nuevos', 'respondio'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/10'}`}>
            {t === 'todos' ? `Todos (${stats.total})` : t === 'nuevos' ? `Nuevos (${stats.nuevos})` : `Respondieron (${stats.respondio})`}
          </button>
        ))}
      </div>

      {/* Lista de contactos */}
      {filtrados.length === 0 ? (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-zinc-300 font-semibold mb-2">Sin contactos aún</p>
          <p className="text-zinc-500 text-sm mb-5">Pulsa "Buscar clientes" y la IA encontrará negocios en Google Maps</p>
          <button onClick={buscarClientes} disabled={buscando}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {buscando ? 'Buscando...' : '🔍 Buscar ahora'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(c => (
            <div key={c.id} className="bg-zinc-900/40 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-100">{c.nombre}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[c.estado] || 'bg-zinc-700 text-zinc-400'}`}>
                    {ESTADO_LABEL[c.estado] || c.estado}
                  </span>
                  {c.rating && <span className="text-[10px] text-amber-400">★ {c.rating}</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {c.ciudad}{c.sector ? ` · ${c.sector}` : ''}
                  {c.web ? <> · <a href={c.web} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{c.web.replace(/^https?:\/\//, '')}</a></> : ''}
                  {c.telefono ? ` · ${c.telefono}` : ''}
                </p>
              </div>
              {c.email_encontrado && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{c.email_encontrado}</span>
              )}
              {c.ultimo_contacto && (
                <span className="text-xs text-zinc-600">
                  {new Date(c.ultimo_contacto).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Cargando...</div>}>
      <DashboardInner />
    </Suspense>
  )
}
