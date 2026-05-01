'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Icon, { type IconName } from '@/components/ui/Icon'

const C = {
  tomate: '#EC1F27',
  tomateDark: '#C41520',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  citron: '#FCD716',
  spirit: '#FF6B35',
  pourpre: '#932D99',
  nuit: '#191829',
  blanc: '#F8F7F2',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
  gray50:  '#FAFAFA',
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
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

      if (role === 'student' && redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo)
        return
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
    <div className="le-auth-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        <Logo variant="default" size="sm" />
        <a href="/" style={{
          fontSize: 13, fontWeight: 600, color: C.gray500, textDecoration: 'none',
          padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(16,24,40,0.06)', backdropFilter: 'blur(10px)',
          transition: 'all .2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = C.nuit }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = C.gray500 }}
        >
          ← Accueil
        </a>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 460px)',
          gap: 64, alignItems: 'center', width: '100%', maxWidth: 1080,
        }} className="login-grid">

          {/* Left — editorial hero */}
          <div className="le-fade-in" style={{ paddingRight: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(236,31,39,0.08)', color: C.tomate, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.tomate, animation: 'lePulseDot 1.8s var(--ease-smooth) infinite' }} />
              Votre espace · 2026
            </div>

            <h1 style={{
              margin: 0, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900,
              letterSpacing: '-0.04em', lineHeight: 0.96, color: C.nuit,
            }}>
              Bon{' '}
              <span style={{
                fontStyle: 'italic',
                background: `linear-gradient(135deg, ${C.tomate} 0%, ${C.spirit} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                retour
              </span>.
            </h1>

            <p style={{ margin: '24px 0 32px', fontSize: 17, lineHeight: 1.55, color: C.gray700, maxWidth: 460 }}>
              Retrouvez votre parcours d'orientation et continuez à explorer les <strong style={{ color: C.nuit }}>130 salons L'Étudiant</strong>.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                { icon: 'target' as IconName, label: 'Recos personnalisées' },
                { icon: 'calendar' as IconName, label: 'RDV en 1 clic' },
                { icon: 'building' as IconName, label: '130 salons' },
              ].map(f => (
                <div key={f.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 999, background: '#fff',
                  border: '1px solid rgba(16,24,40,0.06)', fontSize: 13, fontWeight: 600,
                  color: C.gray700, boxShadow: 'var(--shadow-xs)',
                }}>
                  <Icon name={f.icon} size={16} style={{ color: C.tomate }} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div className="le-scale-in le-surface-elevated" style={{ padding: 40 }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                margin: 0, fontSize: 28, fontWeight: 800,
                letterSpacing: '-0.02em', color: C.nuit,
              }}>
                Connexion
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: C.gray500 }}>
                Connectez-vous à votre espace.
              </p>
            </div>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="prenom.nom@email.com"
                  className="le-input"
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                  <a href="#" style={{ fontSize: 12, color: C.tomate, fontWeight: 600, textDecoration: 'none' }}>
                    Mot de passe oublié ?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="le-input"
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px', background: C.tomateLight, color: C.tomateDark,
                  border: '1px solid rgba(236,31,39,0.20)', borderLeft: `3px solid ${C.tomate}`,
                  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon name="alert" size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, padding: '14px 20px',
                  background: loading
                    ? C.gray300
                    : `linear-gradient(135deg, ${C.tomate} 0%, ${C.tomateDark} 100%)`,
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 15, fontWeight: 700, letterSpacing: '0.01em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px -2px rgba(236,31,39,0.30)',
                  transition: 'all .2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  if (loading) return
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px -2px rgba(236,31,39,0.40)'
                }}
                onMouseLeave={e => {
                  if (loading) return
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(236,31,39,0.30)'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                    Connexion…
                  </>
                ) : (
                  <>Se connecter <span style={{ transition: 'transform .2s var(--ease-spring)' }}>→</span></>
                )}
              </button>
            </form>

            <div style={{ margin: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: C.gray500 }}>
                Nouveau sur L'Étudiant ?
              </span>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { href: '/register',                role: 'Étudiant·e',    color: C.tomate },
                { href: '/register?role=teacher',   role: 'Enseignant·e',  color: C.piscine },
                { href: '/register?role=exhibitor', role: 'Exposant',      color: C.spirit },
                { href: '/register?role=parent',    role: 'Parent',        color: C.pourpre },
              ].map(r => (
                <a
                  key={r.href}
                  href={r.href}
                  className="role-link"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    background: '#fff', border: '1.5px solid var(--le-gray-200)',
                    color: C.nuit, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'all .2s cubic-bezier(0.16, 1, 0.3, 1)',
                    ['--hover-color' as string]: r.color,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    {r.role}
                  </span>
                  <span style={{ fontSize: 14, color: C.gray500 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', textAlign: 'center', fontSize: 12, color: C.gray500 }}>
        L'Étudiant 2026 · Plateforme officielle des salons d'orientation
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .role-link:hover {
          border-color: var(--hover-color) !important;
          background: rgba(0,0,0,0.02) !important;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 880px) {
          .login-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 600,
  color: C.gray700,
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.blanc }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.tomate}`, borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
