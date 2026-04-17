'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

// ─── Education levels ─────────────────────────────────────────────────────────

const LEVELS = [
  { value: '2nde',          label: '2nde Générale / Technologique' },
  { value: '1ère',          label: '1ère Générale / Technologique' },
  { value: 'Terminale',     label: 'Terminale' },
  { value: 'BTS/BUT 1',    label: 'BTS / BUT — 1ère année' },
  { value: 'BTS/BUT 2',    label: 'BTS / BUT — 2ème année' },
  { value: 'Licence 1',    label: 'Licence 1' },
  { value: 'Licence 2',    label: 'Licence 2' },
  { value: 'Licence 3',    label: 'Licence 3' },
  { value: 'Master/MBA',   label: 'Master / MBA' },
  { value: 'Autre',        label: 'Autre niveau' },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = 'form' | 'submitting' | 'success' | 'error'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoothRegisterPage() {
  const [step,           setStep]           = useState<Step>('form')
  const [firstName,      setFirstName]      = useState('')
  const [lastName,       setLastName]       = useState('')
  const [email,          setEmail]          = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [createdName,    setCreatedName]    = useState('')
  const [errorMsg,       setErrorMsg]       = useState('')
  const [countdown,      setCountdown]      = useState(30)
  const [qrPayload,      setQrPayload]      = useState('')

  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Draw QR AFTER the success state is rendered and canvas is in the DOM
  useEffect(() => {
    if (step !== 'success' || !qrPayload || !qrCanvasRef.current) return
    QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
      width: 280, margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    }).catch(err => console.error('[Booth] QR render failed:', err))
  }, [step, qrPayload])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !educationLevel) return
    setStep('submitting')

    try {
      const res  = await fetch('/api/booth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ firstName, lastName, email: email || undefined, educationLevel }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')

      // Store payload — the QR will be drawn by useEffect once canvas is in DOM
      const payload = JSON.stringify({ uid: data.uid, app: 'letudiant-salons' })
      setQrPayload(payload)
      setCreatedName(data.name)
      setStep('success')

      // Auto-reset countdown
      let ct = 30
      setCountdown(ct)
      timerRef.current = setInterval(() => {
        ct--
        setCountdown(ct)
        if (ct <= 0) {
          clearInterval(timerRef.current!)
          resetForm()
        }
      }, 1000)

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue')
      setStep('error')
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetForm() {
    if (timerRef.current) clearInterval(timerRef.current)
    setFirstName('')
    setLastName('')
    setEmail('')
    setEducationLevel('')
    setCreatedName('')
    setErrorMsg('')
    setStep('form')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORM STEP
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'form' || step === 'submitting') {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header stripe */}
        <div style={{ background: '#EC1F27', padding: '0 40px', height: 8, background: 'linear-gradient(90deg, #EC1F27 60%, #0066CC 60% 80%, #FCD716 80%)' }} />

        {/* Logo + Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 40px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 6, height: 36, background: '#0066CC', borderRadius: 3 }} />
              <span style={{ width: 6, height: 36, background: '#FCD716', borderRadius: 3 }} />
              <span style={{ width: 6, height: 36, background: '#EC1F27', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
              l&apos;étudiant
            </span>
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: '2.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            Obtenez votre QR code
          </h1>
          <p style={{ margin: 0, fontSize: '1.125rem', color: 'rgba(255,255,255,0.65)', maxWidth: 480 }}>
            Inscrivez-vous en moins de 60 secondes pour accéder à toutes les ressources du salon
          </p>
        </div>

        {/* Form card */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px 60px' }}>
          <form
            onSubmit={handleSubmit}
            style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 24, padding: '40px 44px', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}
          >
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <Field
                label="Prénom *"
                value={firstName}
                onChange={setFirstName}
                placeholder="Marie"
                autoFocus
              />
              <Field
                label="Nom *"
                value={lastName}
                onChange={setLastName}
                placeholder="Dupont"
              />
            </div>

            {/* Level */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: 10, color: '#1A1A1A' }}>
                Niveau d&apos;études *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {LEVELS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setEducationLevel(l.value)}
                    style={{
                      padding: '14px 16px', borderRadius: 12, border: '2px solid',
                      borderColor: educationLevel === l.value ? '#EC1F27' : '#E8E8E8',
                      background: educationLevel === l.value ? '#FFF0F1' : '#FAFAFA',
                      color: educationLevel === l.value ? '#EC1F27' : '#3D3D3D',
                      fontWeight: educationLevel === l.value ? 700 : 400,
                      fontSize: '0.9375rem', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email (optional) */}
            <Field
              label="Email (optionnel — pour recevoir votre récap)"
              value={email}
              onChange={setEmail}
              placeholder="marie.dupont@lycee.fr"
              type="email"
              style={{ marginBottom: 28 }}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={!firstName.trim() || !lastName.trim() || !educationLevel || step === 'submitting'}
              style={{
                width: '100%', padding: '20px', borderRadius: 14, border: 'none',
                background: (!firstName.trim() || !lastName.trim() || !educationLevel) ? '#E8E8E8' : '#EC1F27',
                color: (!firstName.trim() || !lastName.trim() || !educationLevel) ? '#9B9B9B' : '#fff',
                fontWeight: 800, fontSize: '1.25rem', cursor: (!firstName.trim() || !lastName.trim() || !educationLevel) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {step === 'submitting' ? '⏳ Création en cours…' : 'Obtenir mon QR code →'}
            </button>

            <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: '0.8125rem', color: '#9B9B9B' }}>
              🔒 Vos données sont protégées — elles ne seront jamais partagées avec des tiers sans votre accord.
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR STEP
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 440 }}>
          <p style={{ fontSize: 64, margin: '0 0 16px' }}>😕</p>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.375rem', fontWeight: 800, color: '#1A1A1A' }}>Une erreur est survenue</h2>
          <p style={{ margin: '0 0 24px', color: '#6B6B6B', fontSize: '0.9375rem' }}>{errorMsg}</p>
          <button
            onClick={resetForm}
            style={{ background: '#EC1F27', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            Réessayer →
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS STEP — show QR code
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header stripe */}
      <div style={{ height: 8, background: 'linear-gradient(90deg, #EC1F27 60%, #0066CC 60% 80%, #FCD716 80%)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', textAlign: 'center' }}>

        {/* Success icon */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
          Bienvenue, {createdName.split(' ')[0]} !
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: '1.125rem', color: 'rgba(255,255,255,0.65)' }}>
          Votre profil est créé. Présentez ce QR code à l&apos;entrée du salon.
        </p>

        {/* QR card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 40px', boxShadow: '0 8px 48px rgba(0,0,0,0.5)', marginBottom: 32 }}>
          <canvas ref={qrCanvasRef} style={{ display: 'block', borderRadius: 12 }} />
          <p style={{ margin: '16px 0 4px', fontWeight: 800, fontSize: '1.25rem', color: '#1A1A1A' }}>{createdName}</p>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#EC1F27', fontWeight: 600 }}>✓ Profil créé avec succès</p>
        </div>

        {/* Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, width: '100%', maxWidth: 420 }}>
          {[
            { n: '1', text: 'Présentez ce QR au staff à l\'entrée du salon' },
            { n: '2', text: 'Scannez les QR des stands qui vous intéressent' },
            { n: '3', text: 'Rescannez ce QR à la sortie pour valider votre parcours' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', textAlign: 'left' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#EC1F27', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{s.n}</span>
              <p style={{ margin: 0, color: '#fff', fontSize: '0.9375rem', lineHeight: 1.4 }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Auto-reset countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Retour automatique dans <strong style={{ color: '#FCD716' }}>{countdown}s</strong>
          </p>
          <button
            onClick={resetForm}
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '12px 28px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
          >
            Inscrire une autre personne →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', autoFocus = false, style
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoFocus?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: '#1A1A1A' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '16px 14px', borderRadius: 10,
          border: '2px solid #E8E8E8', fontSize: '1.0625rem', color: '#1A1A1A',
          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#EC1F27' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E8' }}
      />
    </div>
  )
}
