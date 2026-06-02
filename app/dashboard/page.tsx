'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

function initials(name: string) {
  const w = name.trim().split(/\s+/)
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AV = [
  { bg: '#2d1b69', tx: '#c4b5fd', br: '#4c1d95' },
  { bg: '#1e3a5f', tx: '#93c5fd', br: '#1e40af' },
  { bg: '#064e3b', tx: '#6ee7b7', br: '#065f46' },
  { bg: '#78350f', tx: '#fcd34d', br: '#92400e' },
  { bg: '#4a044e', tx: '#f0abfc', br: '#701a75' },
  { bg: '#0c4a6e', tx: '#7dd3fc', br: '#0369a1' },
  { bg: '#3b0764', tx: '#e9d5ff', br: '#4c1d95' },
  { bg: '#450a0a', tx: '#fca5a5', br: '#7f1d1d' },
]
function av(name: string) {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AV.length
  return AV[i]
}

type Negocio = { id: string; nombre: string; sector: string; descripcion: string; ciudad: string; cliente_ideal: string; tono: string; email: string; telefono: string | null }
type Contacto = { id: string; nombre: string; ciudad: string; sector: string; estado: string; telefono: string | null; web: string | null; email_encontrado: string | null; rating: number | null; ultimo_contacto: string | null }
type Stats = { total: number; nuevos: number; email_enviado: number; seguimiento: number; respondio: number }

const EC: Record<string, { label: string; bg: string; color: string; bc: string; dot: string }> = {
  nuevo:         { label: 'Nuevo',         bg: 'rgba(113,113,122,.12)', color: '#a1a1aa', bc: 'rgba(113,113,122,.2)', dot: '#71717a' },
  email_enviado: { label: 'Email enviado',  bg: 'rgba(59,130,246,.1)',   color: '#93c5fd', bc: 'rgba(59,130,246,.2)',  dot: '#3b82f6' },
  seguimiento_1: { label: 'Seguimiento 1',  bg: 'rgba(245,158,11,.1)',   color: '#fcd34d', bc: 'rgba(245,158,11,.2)',  dot: '#f59e0b' },
  seguimiento_2: { label: 'Seguimiento 2',  bg: 'rgba(249,115,22,.1)',   color: '#fdba74', bc: 'rgba(249,115,22,.2)',  dot: '#f97316' },
  respondio:     { label: '✓ Respondió',    bg: 'rgba(16,185,129,.1)',   color: '#6ee7b7', bc: 'rgba(16,185,129,.2)',  dot: '#10b981' },
  descartado:    { label: 'Descartado',     bg: 'rgba(239,68,68,.08)',   color: '#fca5a5', bc: 'rgba(239,68,68,.18)', dot: '#ef4444' },
}

/* ── SVG icons ── */
const IcoGrid = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
const IcoUsers = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="5.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13c0-2.485 1.79-4.5 4-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="11" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.2"/><path d="M13.5 13c0-1.657-1.119-3-2.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const IcoMail = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l6.5 4L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const IcoGear = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v1.4M7.5 12.1V13.5M1 7.5h1.4M12.1 7.5H13.5M2.87 2.87l.99.99M11.14 11.14l.99.99M11.14 3.86l.99-.99M2.87 12.13l.99-.99" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
const IcoSend = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.5 1.5L1 6.5l5 2 1.5 5L12.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 8.5l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
const IcoGlobe = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 1c-1 1.5-1 7 0 9M5.5 1c1 1.5 1 7 0 9" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5.5h9" stroke="currentColor" strokeWidth="1.2"/></svg>
const IcoPhone = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 1h2.2l.8 2.2L4.2 4.5s.7 2 2.3 2.3L7.8 5.5 10 6.3v2.2C10 9.3 9.3 10 8.5 10 4.3 10 1 6.7 1 2.5 1 1.7 1.7 1 2.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
const IcoAt = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 5.5a4 4 0 11-3.3-3.94" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const IcoStar = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l1.03 2.09 2.3.33-1.67 1.63.39 2.3L5 6.13 3 7.35l.39-2.3L1.72 3.42l2.3-.33L5 1z"/></svg>
const IcoTrend = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 9l3-3 2.5 2L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 3h2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>

const CSS = `
  *{box-sizing:border-box}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
  @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
  .fu{animation:fadeUp .3s ease both}
  .spin{animation:spin .75s linear infinite}
  .pulse{animation:pulse 2.2s ease-in-out infinite}
  .nb{transition:all .15s ease}
  .nb:hover{background:rgba(255,255,255,.04)!important}
  .sc{transition:transform .2s ease,box-shadow .2s ease}
  .sc:hover{transform:translateY(-2px)}
  .cr{transition:background .1s ease,border-color .1s ease}
  .cr:hover{background:rgba(139,92,246,.04)!important;border-color:rgba(139,92,246,.18)!important}
  .ab{transition:opacity .15s ease,transform .15s ease}
  .ab:hover{opacity:.88;transform:translateY(-1px)}
  .ab:active{transform:none}
  .tb{transition:color .15s,border-color .15s}
  .tn{transition:all .15s}
  .tn:hover{border-color:rgba(139,92,246,.4)!important}
  input:focus,textarea:focus{border-color:rgba(139,92,246,.5)!important;box-shadow:0 0 0 3px rgba(139,92,246,.1)!important;outline:none}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#27272a;border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:#3f3f46}
`

function Spinner() {
  return <span className="spin" style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
}

function DashboardInner() {
  const searchParams = useSearchParams()
  const negocioId = searchParams.get('id')

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, nuevos: 0, email_enviado: 0, seguimiento: 0, respondio: 0 })
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [guardandoAjustes, setGuardandoAjustes] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [tab, setTab] = useState<'todos' | 'nuevos' | 'respondio'>('todos')
  const [vista, setVista] = useState<'dashboard' | 'ajustes'>('dashboard')
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
      const res = await fetch('/api/buscar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ negocio_id: negocioId }) })
      const data = await res.json()
      showToast('ok', `${data.nuevos} nuevos contactos encontrados`)
      await cargarDatos()
    } catch { showToast('error', 'Error al buscar. Inténtalo de nuevo.') }
    finally { setBuscando(false) }
  }

  const enviarEmails = async () => {
    if (!negocioId) return
    setEnviando(true)
    try {
      const res = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ negocio_id: negocioId }) })
      const data = await res.json()
      showToast('ok', `${data.enviados} emails enviados`)
      await cargarDatos()
    } catch { showToast('error', 'Error al enviar emails.') }
    finally { setEnviando(false) }
  }

  const guardarAjustes = async () => {
    if (!formAjustes || !negocioId) return
    setGuardandoAjustes(true)
    try {
      const res = await fetch('/api/negocio', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formAjustes, id: negocioId }) })
      const data = await res.json()
      if (data.ok) { await cargarDatos(); showToast('ok', 'Ajustes guardados'); setVista('dashboard') }
      else throw new Error(data.error)
    } catch { showToast('error', 'Error al guardar.') }
    finally { setGuardandoAjustes(false) }
  }

  const filtrados = contactos.filter(c => {
    if (tab === 'nuevos') return c.estado === 'nuevo'
    if (tab === 'respondio') return c.estado === 'respondio'
    return true
  })

  if (!negocioId) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#52525b', marginBottom: 16, fontSize: 14 }}>No hay negocio seleccionado</p>
        <a href="/" style={{ color: '#8b5cf6', fontSize: 13.5, textDecoration: 'none' }}>← Configurar negocio</a>
      </div>
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#f4f4f5', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }
  const gradBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '1px solid rgba(139,92,246,.3)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,.3)' }

  return (
    <>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, padding: '12px 16px', background: toast.tipo === 'ok' ? 'rgba(5,46,22,.95)' : 'rgba(69,10,10,.95)', border: `1px solid ${toast.tipo === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, borderRadius: 12, fontSize: 13.5, fontWeight: 500, color: toast.tipo === 'ok' ? '#6ee7b7' : '#fca5a5', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,.5)', animation: 'toastIn .3s cubic-bezier(.2,0,.1,1) both' }}>
          {toast.tipo === 'ok' ? '✓' : '✕'} {toast.texto}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 240, flexShrink: 0, background: 'linear-gradient(180deg,#0d0d1a 0%,#0a0a14 100%)', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', padding: '20px 12px', position: 'relative', overflow: 'hidden' }}>
          {/* Orb bg */}
          <div style={{ position: 'absolute', top: -60, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 0', marginBottom: 32, position: 'relative' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7c3aed,#4338ca)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, boxShadow: '0 4px 16px rgba(124,58,237,.45)' }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fafafa', letterSpacing: '-0.3px' }}>Captia</span>
            <div style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(124,58,237,.18)', color: '#a78bfa', border: '1px solid rgba(124,58,237,.3)', borderRadius: 5, padding: '2px 6px' }}>BETA</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {([
              { key: 'dashboard', label: 'Dashboard',  icon: <IcoGrid />,  disabled: false },
              { key: 'contactos', label: 'Contactos',  icon: <IcoUsers />, disabled: true },
              { key: 'emails',    label: 'Emails',     icon: <IcoMail />,  disabled: true },
              { key: 'ajustes',   label: 'Ajustes',    icon: <IcoGear />,  disabled: false },
            ] as const).map(item => {
              const active = vista === item.key
              return (
                <button key={item.key}
                  onClick={() => !item.disabled && setVista(item.key as 'dashboard' | 'ajustes')}
                  disabled={item.disabled}
                  className="nb"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign: 'left', fontSize: 13.5, fontWeight: 500, background: active ? 'rgba(139,92,246,.12)' : 'transparent', color: item.disabled ? '#3f3f46' : active ? '#c4b5fd' : '#71717a', borderLeft: `2px solid ${active ? '#8b5cf6' : 'transparent'}` }}>
                  <span style={{ color: item.disabled ? '#2d2d35' : active ? '#8b5cf6' : '#52525b', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                  {item.disabled && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#3f3f46', letterSpacing: '0.05em' }}>PRONTO</span>}
                </button>
              )
            })}
          </nav>

          {/* Business footer */}
          {negocio && (
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,rgba(139,92,246,.3),rgba(67,56,202,.3))', border: '1px solid rgba(139,92,246,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#c4b5fd', flexShrink: 0 }}>
                    {negocio.nombre.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e4e7', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{negocio.nombre}</p>
                    <p style={{ fontSize: 11, color: '#52525b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{negocio.ciudad}</p>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>IA activa</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Topbar */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(8,8,16,.88)', backdropFilter: 'blur(16px)' }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', ...(vista === 'dashboard' ? { background: 'linear-gradient(90deg,#fff 20%,#a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: '#fff' }) }}>
                {vista === 'ajustes' ? 'Ajustes del negocio' : 'Panel de control'}
              </h1>
              {negocio && (
                <p style={{ fontSize: 12, color: '#52525b', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{negocio.sector}</span>
                  <span style={{ color: '#27272a' }}>·</span>
                  <span>Tono {negocio.tono}</span>
                  {vista === 'dashboard' && stats.total > 0 && <>
                    <span style={{ color: '#27272a' }}>·</span>
                    <span style={{ color: '#10b981' }}>{stats.total} leads totales</span>
                  </>}
                </p>
              )}
            </div>

            {vista === 'dashboard' && (
              <button onClick={buscarClientes} disabled={buscando || enviando} className="ab"
                style={{ ...gradBtn, opacity: buscando || enviando ? 0.55 : 1, cursor: buscando || enviando ? 'not-allowed' : 'pointer' }}>
                {buscando ? <><Spinner />Buscando...</> : <><IcoSearch />Buscar clientes</>}
              </button>
            )}

            {vista === 'ajustes' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setVista('dashboard')} className="ab"
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#a1a1aa', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={guardarAjustes} disabled={guardandoAjustes} className="ab"
                  style={{ ...gradBtn, opacity: guardandoAjustes ? 0.6 : 1, cursor: guardandoAjustes ? 'not-allowed' : 'pointer' }}>
                  {guardandoAjustes ? <><Spinner />Guardando...</> : '✓ Guardar cambios'}
                </button>
              </div>
            )}
          </div>

          {/* ── DASHBOARD VIEW ── */}
          {vista === 'dashboard' && (
            <div className="fu" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {([
                  { label: 'Total leads',     value: stats.total,        icon: '🎯', ac: '#8b5cf6', gl: 'rgba(139,92,246,.15)', br: 'rgba(139,92,246,.22)' },
                  { label: 'Sin contactar',   value: stats.nuevos,       icon: '✨', ac: '#3b82f6', gl: 'rgba(59,130,246,.13)',  br: 'rgba(59,130,246,.2)'  },
                  { label: 'Emails enviados', value: stats.email_enviado, icon: '📤', ac: '#06b6d4', gl: 'rgba(6,182,212,.13)',  br: 'rgba(6,182,212,.2)'   },
                  { label: 'Respondieron',    value: stats.respondio,    icon: '🏆', ac: '#10b981', gl: 'rgba(16,185,129,.13)', br: 'rgba(16,185,129,.2)'  },
                ] as const).map((s, i) => (
                  <div key={s.label} className="sc" style={{ background: `linear-gradient(145deg,rgba(255,255,255,.03) 0%,${s.gl} 100%)`, border: `1px solid ${s.br}`, borderRadius: 16, padding: '20px 20px 16px', animationDelay: `${i * 0.06}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: s.gl, border: `1px solid ${s.br}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{s.icon}</div>
                      {s.value > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                          <IcoTrend /> +{s.value}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                    <div style={{ fontSize: 12.5, color: '#71717a', fontWeight: 500, marginBottom: 14 }}>{s.label}</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${s.gl.replace('.13','.6')},${s.ac})`, width: stats.total > 0 ? `${Math.min(100, (s.value / Math.max(stats.total, 1)) * 100)}%` : '5%', transition: 'width .8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA enviar */}
              {stats.nuevos > 0 && (
                <div style={{ background: 'linear-gradient(135deg,rgba(30,58,138,.35) 0%,rgba(17,24,39,.4) 100%)', border: '1px solid rgba(59,130,246,.18)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 4px 20px rgba(59,130,246,.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(59,130,246,.14)', border: '1px solid rgba(59,130,246,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤖</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#bfdbfe', margin: '0 0 3px' }}>
                        {stats.nuevos} lead{stats.nuevos > 1 ? 's' : ''} listo{stats.nuevos > 1 ? 's' : ''} para ser contactado{stats.nuevos > 1 ? 's' : ''}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(147,197,253,.5)', margin: 0 }}>
                        La IA generará un email personalizado para cada uno basado en su negocio
                      </p>
                    </div>
                  </div>
                  <button onClick={enviarEmails} disabled={enviando || buscando} className="ab"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: '1px solid rgba(59,130,246,.3)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: enviando || buscando ? 'not-allowed' : 'pointer', opacity: enviando || buscando ? 0.55 : 1, flexShrink: 0, boxShadow: '0 4px 16px rgba(37,99,235,.35)' }}>
                    {enviando ? <><Spinner />Enviando...</> : <><IcoSend />Enviar con IA</>}
                  </button>
                </div>
              )}

              {/* Tabs + tabla */}
              <div>
                {/* Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 0 }}>
                  {([
                    { key: 'todos' as const,    label: 'Todos',         count: stats.total },
                    { key: 'nuevos' as const,   label: 'Sin contactar', count: stats.nuevos },
                    { key: 'respondio' as const, label: 'Respondieron', count: stats.respondio },
                  ]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className="tb"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: `2px solid ${tab === t.key ? '#8b5cf6' : 'transparent'}`, marginBottom: -1, background: 'transparent', cursor: 'pointer', color: tab === t.key ? '#e4e4e7' : '#52525b' }}>
                      {t.label}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: tab === t.key ? 'rgba(139,92,246,.2)' : 'rgba(255,255,255,.05)', color: tab === t.key ? '#c4b5fd' : '#52525b' }}>{t.count}</span>
                    </button>
                  ))}
                </div>

                {filtrados.length === 0 ? (
                  <div style={{ border: '1px dashed rgba(255,255,255,.08)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '60px 32px', textAlign: 'center', background: 'rgba(139,92,246,.015)' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>🔍</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e7', margin: '0 0 8px' }}>Sin contactos aún</p>
                    <p style={{ fontSize: 13.5, color: '#52525b', margin: '0 0 24px', lineHeight: 1.6 }}>
                      Pulsa <strong style={{ color: '#a78bfa' }}>Buscar clientes</strong> y la IA encontrará empresas en tu ciudad.<br />Un solo clic.
                    </p>
                    <button onClick={buscarClientes} disabled={buscando} className="ab"
                      style={{ ...gradBtn, padding: '11px 24px', borderRadius: 12, fontSize: 14, boxShadow: '0 8px 24px rgba(124,58,237,.4)', opacity: buscando ? 0.6 : 1, cursor: buscando ? 'not-allowed' : 'pointer' }}>
                      {buscando ? <><Spinner />Buscando...</> : <><IcoSearch />Buscar ahora</>}
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px solid rgba(255,255,255,.07)', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                    {/* Table head */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px 110px 210px 74px 68px', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                      {['NEGOCIO', 'ESTADO', 'CIUDAD', 'CONTACTO', 'RATING', 'FECHA'].map(h => (
                        <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#3f3f46', letterSpacing: '0.07em' }}>{h}</span>
                      ))}
                    </div>

                    {filtrados.map((c, idx) => {
                      const cfg = EC[c.estado] || EC.nuevo
                      const a = av(c.nombre)
                      const ini = initials(decodeHtml(c.nombre))
                      return (
                        <div key={c.id} className="cr"
                          style={{ display: 'grid', gridTemplateColumns: '1fr 148px 110px 210px 74px 68px', padding: '12px 18px', alignItems: 'center', borderBottom: idx < filtrados.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', background: 'transparent' }}>

                          {/* Negocio */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: a.bg, border: `1px solid ${a.br}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: a.tx, letterSpacing: '-0.2px' }}>{ini}</div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4e7', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{decodeHtml(c.nombre)}</p>
                              <p style={{ fontSize: 11.5, color: '#52525b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sector?.length > 35 ? c.sector.slice(0, 35) + '…' : c.sector}</p>
                            </div>
                          </div>

                          {/* Estado */}
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bc}`, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                              {cfg.label}
                            </span>
                          </div>

                          {/* Ciudad */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#71717a' }}>
                            <span style={{ color: '#3f3f46', display: 'flex' }}><IcoGlobe /></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ciudad}</span>
                          </div>

                          {/* Contacto */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {c.email_encontrado && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#93c5fd' }}>
                                <IcoAt /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email_encontrado}</span>
                              </span>
                            )}
                            {c.telefono && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#86efac' }}>
                                <IcoPhone />{c.telefono}
                              </span>
                            )}
                            {c.web && (
                              <a href={c.web} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#c4b5fd', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <IcoGlobe />{c.web.replace(/^https?:\/\//, '').split('/')[0].slice(0, 22)}
                              </a>
                            )}
                            {!c.email_encontrado && !c.telefono && !c.web && <span style={{ fontSize: 12, color: '#27272a' }}>—</span>}
                          </div>

                          {/* Rating */}
                          <div>
                            {c.rating
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700, color: '#fbbf24' }}><IcoStar />{c.rating}</span>
                              : <span style={{ fontSize: 12, color: '#27272a' }}>—</span>
                            }
                          </div>

                          {/* Fecha */}
                          <div>
                            {c.ultimo_contacto
                              ? <span style={{ fontSize: 11.5, color: '#52525b' }}>{new Date(c.ultimo_contacto).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                              : <span style={{ fontSize: 12, color: '#27272a' }}>—</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AJUSTES VIEW ── */}
          {vista === 'ajustes' && formAjustes && (
            <div className="fu" style={{ padding: '28px 32px' }}>
              <p style={{ fontSize: 12.5, color: '#52525b', marginBottom: 28 }}>✦ Los cambios se aplican a los próximos emails. Los ya enviados no se modifican.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                <div>
                  <label style={lbl}>Nombre del negocio</label>
                  <input type="text" placeholder="Ej: Marsof Technology" value={formAjustes.nombre ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, nombre: e.target.value } : f)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Sector</label>
                  <input type="text" placeholder="Ej: Tecnología, Fontanero…" value={formAjustes.sector ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, sector: e.target.value } : f)} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Descripción</label>
                  <textarea rows={3} placeholder="Qué hacéis exactamente…" value={formAjustes.descripcion ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, descripcion: e.target.value } : f)} style={{ ...inp, resize: 'none' }} />
                </div>
                <div>
                  <label style={lbl}>Ciudad de búsqueda</label>
                  <input type="text" placeholder="Ej: Madrid, Sevilla…" value={formAjustes.ciudad ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, ciudad: e.target.value } : f)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email de respuestas</label>
                  <input type="email" placeholder="tu@empresa.com" value={formAjustes.email ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, email: e.target.value } : f)} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Cliente ideal</label>
                  <textarea rows={3} placeholder="Quiénes son tus clientes…" value={formAjustes.cliente_ideal ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, cliente_ideal: e.target.value } : f)} style={{ ...inp, resize: 'none' }} />
                </div>
                <div>
                  <label style={lbl}>Teléfono WhatsApp</label>
                  <input type="tel" placeholder="612 345 678 (opcional)" value={formAjustes.telefono ?? ''} onChange={e => setFormAjustes(f => f ? { ...f, telefono: e.target.value } : f)} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Tono de emails</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { v: 'cercano',     l: 'Cercano',     e: '👋', d: 'Natural y directo' },
                      { v: 'profesional', l: 'Profesional', e: '💼', d: 'Serio y formal' },
                      { v: 'divertido',   l: 'Divertido',   e: '🎯', d: 'Creativo y fresco' },
                    ].map(t => (
                      <button key={t.v} onClick={() => setFormAjustes(f => f ? { ...f, tono: t.v } : f)}
                        className="tn"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '14px 18px', borderRadius: 12, border: formAjustes.tono === t.v ? '1px solid rgba(139,92,246,.5)' : '1px solid rgba(255,255,255,.07)', background: formAjustes.tono === t.v ? 'rgba(139,92,246,.1)' : 'rgba(255,255,255,.02)', cursor: 'pointer', minWidth: 150, boxShadow: formAjustes.tono === t.v ? '0 0 0 1px rgba(139,92,246,.15)' : 'none' }}>
                        <span style={{ fontSize: 22 }}>{t.e}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: formAjustes.tono === t.v ? '#c4b5fd' : '#a1a1aa' }}>{t.l}</span>
                        <span style={{ fontSize: 11.5, color: '#52525b' }}>{t.d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2.5px solid rgba(139,92,246,.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin .75s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  )
}
