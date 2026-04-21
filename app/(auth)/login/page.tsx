'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const C = {
  tomate: '#EC1F27',
  tomateDark: '#C41520',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  citron: '#FCD716',
  spirit: '#FF6B35',
  menthe: '#4DB8A8',
  pourpre: '#932D99',
  nuit: '#191829',
  blanc: '#F8F7F2',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
}

function LoginInner() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { getSupabase } = await import('@/lib/supabase/client')
      const supabase = getSupabase()

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw new Error(signInError.message || 'Identifiants invalides')

      const uid = signInData.user?.id
      let role: string = 'student'
      if (uid) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', uid)
          .maybeSingle()
        if (profile?.role) role = profile.role as string
      }

      if (role === 'teacher')   { router.push('/teacher/dashboard'); return }
      if (role === 'exhibitor') { router.push('/exhibitor/dashboard'); return }
      if (role === 'admin')     { router.push('/admin/dashboard'); return }
      if (role === 'parent')    { router.push('/parent/home'); return }
      router.push('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.blanc, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel — colorblock editorial */}
      <div
        style={{
          background: C.tomate,
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.citron }} />
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.piscine }} />
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: C.citron,
              marginBottom: 16,
            }}
          >
            Votre espace — 2026
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              color: '#fff',
            }}
          >
            Bon
            <br />
            <span style={{ fontStyle: 'italic', color: C.citron }}>retour</span>.
          </h1>
          <p style={{ margin: '24px 0 0', fontSize: 16, lineHeight: 1.6, maxWidth: 380, opacity: 0.9 }}>
            Retrouvez votre parcours d'orientation et continuez à explorer les 130 salons L'Étudiant.
          </p>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>
          Saguez & Partners Design · L'Étudiant 2026
        </div>

        {/* Giant italic accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -60,
            right: -40,
            fontSize: 280,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.08)',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            pointerEvents: 'none',
          }}
        >
          hi.
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ padding: '48px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo variant="default" size="sm" />
          <a
            href="/"
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.gray500,
              textDecoration: 'none',
            }}
          >
            ← Retour à l'accueil
          </a>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'inline-block', position: 'relative', paddingBottom: 8, marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: C.tomate,
                }}
              >
                Connexion
              </span>
              <div style={{ position: 'absolute', left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                fontWeight: 900,
                color: C.nuit,
                textTransform: 'uppercase',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Bienvenue
            </h2>
            <p style={{ margin: '12px 0 32px', fontSize: 15, color: C.gray500 }}>
              Connectez-vous à votre espace salon.
            </p>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="prenom.nom@email.com"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.tomate)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.gray200)}
                />
              </div>
              <div>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.tomate)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.gray200)}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: C.tomateLight,
                    color: C.tomate,
                    border: `1.5px solid ${C.tomate}`,
                    borderLeft: `6px solid ${C.tomate}`,
                    borderRadius: 2,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: '14px 20px',
                  background: loading ? C.gray300 : C.nuit,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.tomate }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.nuit }}
              >
                {loading ? 'Connexion...' : 'Se connecter →'}
              </button>
            </form>

            <div style={{ margin: '32px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gray500 }}>
                Ou créer un compte
              </span>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <a href="/register" style={registerLinkStyle(C.tomate)}>
                Étudiant·e
                <span style={{ fontSize: 16 }}>→</span>
              </a>
              <a href="/register?role=teacher" style={registerLinkStyle(C.piscine)}>
                Enseignant·e
                <span style={{ fontSize: 16 }}>→</span>
              </a>
              <a href="/register?role=exhibitor" style={registerLinkStyle(C.spirit)}>
                Exposant
                <span style={{ fontSize: 16 }}>→</span>
              </a>
              <a href="/register?role=parent" style={registerLinkStyle(C.pourpre)}>
                Parent
                <span style={{ fontSize: 16 }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: C.nuit,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: `1.5px solid ${C.gray200}`,
  borderRadius: 2,
  fontSize: 14,
  color: C.nuit,
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

function registerLinkStyle(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'transparent',
    border: `1.5px solid ${color}`,
    color,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    borderRadius: 2,
    transition: 'all 0.15s',
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: C.blanc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.tomate}`, borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
