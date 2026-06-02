'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  { value: 'cercano',     label: 'Cercano',     desc: 'Natural y real',        emoji: '👋' },
  { value: 'profesional', label: 'Profesional', desc: 'Serio y directo',       emoji: '💼' },
  { value: 'divertido',   label: 'Divertido',   desc: 'Con chispa y energía',  emoji: '🎯' },
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

  const canNext0 = form.nombre && form.sector && form.descripcion
  const canNext1 = form.ciudad && form.cliente_ideal
  const canNext2 = form.email

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #05050a; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .captia-root {
          min-height: 100vh;
          background: #05050a;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Fondo animado ── */
        .bg-glow-1 {
          position: fixed; top: -200px; left: -100px;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .bg-glow-2 {
          position: fixed; bottom: -300px; right: -100px;
          width: 800px; height: 800px; border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .bg-glow-3 {
          position: fixed; top: 40%; left: 35%;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .bg-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* ── Header ── */
        .header {
          display: flex; align-items: center; padding: 18px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative; z-index: 10;
          background: rgba(5,5,10,0.8);
          backdrop-filter: blur(12px);
        }
        .logo-icon {
          width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 17px; box-shadow: 0 0 24px rgba(124,58,237,0.5), 0 0 48px rgba(124,58,237,0.15);
          animation: float 4s ease-in-out infinite;
        }
        .logo-text {
          font-size: 19px; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; margin-left: 10px;
        }
        .header-tag {
          margin-left: 16px; font-size: 12px; color: #52525b;
          border-left: 1px solid #27272a; padding-left: 16px;
        }
        .header-badge {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
          border-radius: 99px; padding: 5px 14px; font-size: 11px;
          color: #a78bfa; font-weight: 600; letter-spacing: 0.5px;
        }
        .header-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,0.6);
        }

        /* ── Layout ── */
        .main-layout {
          flex: 1; display: flex; position: relative; z-index: 1;
        }

        /* ── Panel izquierdo ── */
        .left-panel {
          flex: 1; padding: 64px 72px;
          display: flex; flex-direction: column; justify-content: center;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(124,58,237,0.10); border: 1px solid rgba(124,58,237,0.22);
          border-radius: 99px; padding: 6px 16px; margin-bottom: 32px;
          animation: fade-in-up 0.5s ease both;
        }
        .pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a78bfa; position: relative;
        }
        .pill-dot::after {
          content: ''; position: absolute; inset: -2px;
          border-radius: 50%; background: rgba(167,139,250,0.4);
          animation: pulse-ring 1.5s ease-out infinite;
        }
        .pill span { font-size: 11px; color: #a78bfa; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }

        .hero-title {
          font-size: 52px; font-weight: 900; color: #fff;
          line-height: 1.1; margin-bottom: 20px; letter-spacing: -2px;
          animation: fade-in-up 0.5s 0.1s ease both;
        }
        .hero-title .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #c084fc 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }
        .hero-sub {
          font-size: 16px; color: #71717a; line-height: 1.75; max-width: 460px;
          margin-bottom: 52px;
          animation: fade-in-up 0.5s 0.2s ease both;
        }

        .features-list {
          display: flex; flex-direction: column; gap: 24px;
          animation: fade-in-up 0.5s 0.3s ease both;
        }
        .feature-item {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 16px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          transition: all 0.2s;
        }
        .feature-item:hover {
          background: rgba(124,58,237,0.05);
          border-color: rgba(124,58,237,0.18);
          transform: translateX(4px);
        }
        .feature-icon {
          width: 42px; height: 42px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.10));
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-size: 19px;
        }
        .feature-title { font-size: 14px; font-weight: 600; color: #e4e4e7; margin-bottom: 3px; }
        .feature-desc  { font-size: 12px; color: #52525b; line-height: 1.55; }

        .stats-row {
          display: flex; gap: 0; margin-top: 48px; padding-top: 40px;
          border-top: 1px solid rgba(255,255,255,0.05);
          animation: fade-in-up 0.5s 0.4s ease both;
        }
        .stat-item { flex: 1; text-align: center; }
        .stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.05); }
        .stat-num {
          font-size: 28px; font-weight: 900; letter-spacing: -1px;
          background: linear-gradient(135deg, #a78bfa, #818cf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-label { font-size: 11px; color: #3f3f46; margin-top: 2px; }

        /* ── Panel derecho ── */
        .right-panel {
          width: 540px; flex-shrink: 0;
          padding: 40px 52px;
          display: flex; flex-direction: column; justify-content: center;
          background: rgba(255,255,255,0.015);
        }

        /* Progress */
        .progress-bar {
          display: flex; gap: 6px; margin-bottom: 36px;
        }
        .progress-segment {
          flex: 1; height: 3px; border-radius: 99px;
          background: #1c1c24;
          transition: background 0.5s;
          overflow: hidden; position: relative;
        }
        .progress-segment.active::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 99px;
        }

        /* Card */
        .step-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 32px 28px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 0 1px rgba(124,58,237,0.05), 0 24px 48px rgba(0,0,0,0.4);
          animation: fade-in-up 0.35s ease both;
        }
        .step-label {
          font-size: 10px; font-weight: 700; color: #7c3aed;
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
        }
        .step-title { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: -0.5px; }
        .step-sub   { font-size: 13px; color: #52525b; margin-bottom: 28px; line-height: 1.5; }

        /* Inputs */
        .field-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #71717a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
        }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 12px 16px;
          font-size: 14px; color: #f4f4f5;
          outline: none; transition: all 0.2s;
          font-family: inherit;
        }
        .field-input::placeholder { color: #3f3f46; }
        .field-input:focus {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.04);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .field-group { margin-bottom: 18px; }

        /* Sectores grid */
        .sectores-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 18px;
        }
        .sector-btn {
          padding: 10px 8px; border-radius: 11px; cursor: pointer;
          transition: all 0.15s; display: flex; flex-direction: column; gap: 5px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          text-align: left;
        }
        .sector-btn:hover { border-color: rgba(124,58,237,0.35); background: rgba(124,58,237,0.06); }
        .sector-btn.selected {
          border-color: #7c3aed !important;
          background: rgba(124,58,237,0.14) !important;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.3), inset 0 1px 0 rgba(167,139,250,0.1);
        }
        .sector-emoji { font-size: 18px; line-height: 1; }
        .sector-label { font-size: 10px; font-weight: 500; line-height: 1.3; color: #71717a; }
        .sector-btn.selected .sector-label { color: #c4b5fd; }

        /* Tono grid */
        .tonos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
        .tono-btn {
          padding: 14px 10px; border-radius: 12px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          transition: all 0.15s;
        }
        .tono-btn:hover { border-color: rgba(124,58,237,0.35); background: rgba(124,58,237,0.06); }
        .tono-btn.selected {
          border-color: #7c3aed !important;
          background: rgba(124,58,237,0.14) !important;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.3);
        }
        .tono-emoji { font-size: 22px; }
        .tono-name { font-size: 12px; font-weight: 700; color: #a1a1aa; }
        .tono-btn.selected .tono-name { color: #c4b5fd; }
        .tono-desc { font-size: 10px; color: #3f3f46; text-align: center; line-height: 1.4; }

        /* Summary items */
        .summary-item {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 13px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 10px;
          transition: all 0.2s;
        }
        .summary-item:hover { border-color: rgba(124,58,237,0.2); background: rgba(124,58,237,0.04); }
        .summary-emoji { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .summary-title { font-size: 13px; font-weight: 600; color: #e4e4e7; }
        .summary-desc  { font-size: 11px; color: #52525b; margin-top: 2px; line-height: 1.4; }

        /* Buttons */
        .btn-primary {
          width: 100%; padding: 14px; border-radius: 13px; border: none;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; letter-spacing: -0.2px;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.1) inset;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          box-shadow: 0 6px 28px rgba(124,58,237,0.55), 0 1px 0 rgba(255,255,255,0.1) inset;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          background: #1c1c24; color: #3f3f46; cursor: not-allowed;
          box-shadow: none; transform: none;
        }
        .btn-back {
          padding: 14px 18px; border-radius: 13px;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: #52525b; font-size: 13px; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .btn-back:hover { border-color: rgba(255,255,255,0.15); color: #a1a1aa; }
        .btn-row { display: flex; gap: 10px; }
        .btn-row .btn-primary { flex: 1; width: auto; }

        .footer-text {
          text-align: center; font-size: 11px; color: #27272a; margin-top: 22px;
          letter-spacing: 0.3px;
        }

        /* Spinner */
        .spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          animation: spin 0.6s linear infinite;
        }

        @media (max-width: 960px) {
          .left-panel { display: none; }
          .right-panel { width: 100%; padding: 32px 24px; }
          .hero-title { font-size: 36px; }
          .header { padding: 16px 24px; }
          .header-tag { display: none; }
        }
      `}</style>

      <div className="captia-root">
        {/* Fondo */}
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
        <div className="bg-glow-3" />
        <div className="bg-grid" />

        {/* Header */}
        <header className="header">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Captia</span>
          <span className="header-tag">Clientes automáticos para tu negocio</span>
          <div className="header-badge">
            <span className="header-dot" />
            100% Gratis · Sin tarjeta
          </div>
        </header>

        {/* Layout */}
        <div className="main-layout">

          {/* ── Columna izquierda ── */}
          <div className="left-panel">
            <div style={{ maxWidth: 500 }}>
              <div className="pill">
                <span className="pill-dot" />
                <span>Nuevo · IA para ventas locales</span>
              </div>

              <h1 className="hero-title">
                Consigue clientes<br />
                <span className="gradient-text">mientras duermes</span>
              </h1>

              <p className="hero-sub">
                Captia escanea tu ciudad, encuentra negocios que pueden comprarte,
                les escribe emails con IA y hace el seguimiento por ti.<br />
                <strong style={{ color: '#e4e4e7' }}>Tú solo cierras los tratos.</strong>
              </p>

              <div className="features-list">
                {[
                  { icon: '🔍', title: 'Búsqueda automática de clientes',  desc: 'Encuentra negocios locales usando OpenStreetMap y scraping inteligente. Sin pagar APIs.' },
                  { icon: '✉️', title: 'Emails únicos generados por IA',   desc: 'Gemini escribe cada email adaptado al negocio destino. Nada de plantillas copiadas.' },
                  { icon: '🔁', title: 'Seguimiento sin esfuerzo',          desc: 'A los 4 días envía follow-up automático. A los 11 días, otro. Tú no tocas nada.' },
                  { icon: '📱', title: 'Alertas en tiempo real',             desc: 'Email + WhatsApp cuando alguien responda. Reacciona en segundos, no en días.' },
                ].map(f => (
                  <div className="feature-item" key={f.title}>
                    <div className="feature-icon">{f.icon}</div>
                    <div>
                      <div className="feature-title">{f.title}</div>
                      <div className="feature-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="stats-row">
                {[
                  { num: '+200', label: 'Negocios contactados' },
                  { num: '68%',  label: 'Tasa de apertura' },
                  { num: '< 5m', label: 'Para empezar' },
                ].map(s => (
                  <div className="stat-item" key={s.label}>
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="right-panel">

            {/* Progress */}
            <div className="progress-bar">
              {[0,1,2,3].map(i => (
                <div key={i} className={`progress-segment ${i <= step ? 'active' : ''}`} />
              ))}
            </div>

            {/* ── Paso 0 ── */}
            {step === 0 && (
              <div className="step-card">
                <div className="step-label">Paso 1 de 4</div>
                <h2 className="step-title">¿A qué te dedicas?</h2>
                <p className="step-sub">La IA necesita entender tu negocio para buscar los clientes correctos.</p>

                <div className="field-group">
                  <label className="field-label">Nombre del negocio</label>
                  <input className="field-input" type="text" autoFocus
                    placeholder="Ej: Clínica Dental Martínez"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>

                <div className="field-group">
                  <label className="field-label">Sector</label>
                  <div className="sectores-grid">
                    {SECTORES.map(s => (
                      <button key={s.label}
                        className={`sector-btn ${form.sector === s.label ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, sector: s.label }))}>
                        <span className="sector-emoji">{s.icon}</span>
                        <span className="sector-label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">¿Qué haces exactamente?</label>
                  <textarea className="field-input" rows={2} style={{ resize: 'none' }}
                    placeholder="Ej: Somos una clínica dental en Madrid. Hacemos ortodoncia, implantes y revisiones."
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>

                <button className="btn-primary" disabled={!canNext0} onClick={() => setStep(1)}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ── Paso 1 ── */}
            {step === 1 && (
              <div className="step-card">
                <div className="step-label">Paso 2 de 4</div>
                <h2 className="step-title">¿A quién le vendes?</h2>
                <p className="step-sub">Cuanto más concreto seas, mejor encontrará la IA.</p>

                <div className="field-group">
                  <label className="field-label">Ciudad donde buscamos clientes</label>
                  <input className="field-input" type="text" autoFocus
                    placeholder="Ej: Madrid, Sevilla, Huelva..."
                    value={form.ciudad}
                    onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} />
                </div>

                <div className="field-group">
                  <label className="field-label">¿Quién es tu cliente ideal?</label>
                  <textarea className="field-input" rows={3} style={{ resize: 'none' }}
                    placeholder="Ej: Restaurantes y hoteles de Madrid que necesiten proveedor de vinos."
                    value={form.cliente_ideal}
                    onChange={e => setForm(f => ({ ...f, cliente_ideal: e.target.value }))} />
                </div>

                <div className="field-group">
                  <label className="field-label">Tono de los emails</label>
                  <div className="tonos-grid">
                    {TONOS.map(t => (
                      <button key={t.value}
                        className={`tono-btn ${form.tono === t.value ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, tono: t.value }))}>
                        <span className="tono-emoji">{t.emoji}</span>
                        <span className="tono-name">{t.label}</span>
                        <span className="tono-desc">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="btn-row">
                  <button className="btn-back" onClick={() => setStep(0)}>← Atrás</button>
                  <button className="btn-primary" disabled={!canNext1} onClick={() => setStep(2)}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── Paso 2 ── */}
            {step === 2 && (
              <div className="step-card">
                <div className="step-label">Paso 3 de 4</div>
                <h2 className="step-title">¿Cómo te avisamos?</h2>
                <p className="step-sub">Te notificamos cuando alguien responda.</p>

                <div className="field-group">
                  <label className="field-label">Tu email</label>
                  <input className="field-input" type="email" autoFocus
                    placeholder="tu@empresa.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 6 }}>Los clientes responderán a este email</p>
                </div>

                <div className="field-group">
                  <label className="field-label">Teléfono <span style={{ color: '#27272a', fontWeight: 400, textTransform: 'none' }}>(opcional — avisos WhatsApp)</span></label>
                  <input className="field-input" type="tel"
                    placeholder="612 345 678"
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>

                <div className="btn-row">
                  <button className="btn-back" onClick={() => setStep(1)}>← Atrás</button>
                  <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(3)}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── Paso 3 ── */}
            {step === 3 && (
              <div className="step-card">
                <div className="step-label">Paso 4 de 4</div>
                <h2 className="step-title">Todo listo 🚀</h2>
                <p className="step-sub">Esto es lo que hará Captia por ti:</p>

                {[
                  { icon: '🔍', title: 'Busca negocios',           desc: `Encuentra clientes en ${form.ciudad} vía OpenStreetMap` },
                  { icon: '✉️', title: 'Escribe y manda emails',   desc: `IA redacta cada email en tono ${form.tono}` },
                  { icon: '🔁', title: 'Seguimiento automático',   desc: 'Reenvía si no responden a los 4 y 11 días' },
                  { icon: '📱', title: 'Te avisa al instante',     desc: `Notificación a ${form.email}` },
                ].map(item => (
                  <div className="summary-item" key={item.title}>
                    <span className="summary-emoji">{item.icon}</span>
                    <div>
                      <div className="summary-title">{item.title}</div>
                      <div className="summary-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}

                <div className="btn-row" style={{ marginTop: 24 }}>
                  <button className="btn-back" onClick={() => setStep(2)}>← Atrás</button>
                  <button className="btn-primary" disabled={guardando} onClick={guardar}
                    style={{ opacity: guardando ? 0.8 : 1 }}>
                    {guardando ? <><span className="spinner" />Configurando...</> : '⚡ Activar Captia'}
                  </button>
                </div>
              </div>
            )}

            <p className="footer-text">Completamente gratis · Sin tarjeta · Sin límites</p>
          </div>
        </div>
      </div>
    </>
  )
}
