'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const C = {
  tomate: '#EC1F27',
  tomateDark: '#C41520',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  piscineLight: '#E6EEF9',
  citron: '#FCD716',
  citronLight: '#FFF9DB',
  spirit: '#FF6B35',
  menthe: '#4DB8A8',
  mentheLight: '#E6F4F1',
  pourpre: '#932D99',
  tropical: '#00A896',
  framboise: '#E91E63',
  nuit: '#191829',
  blanc: '#F8F7F2',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

const STRIPE_COLORS = [C.tomate, C.piscine, C.citron, C.spirit, C.menthe, C.pourpre]

interface StudentProfile {
  name: string
  education_level: string | null
  bac_series: string | null
  education_branches: string[]
  intent_level: string
  intent_score: number
  wishlist: string[]
  last_dwell_minutes: number | null
}

const INTENT_LABEL: Record<string, string> = {
  low: 'Explorateur',
  medium: 'Comparateur',
  high: 'Décideur',
}
const INTENT_COLOR: Record<string, string> = {
  low: C.gray500,
  medium: C.piscine,
  high: C.tomate,
}

function MultiStripe() {
  return (
    <div style={{ display: 'flex', height: 5, width: '100%' }}>
      {STRIPE_COLORS.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  )
}

function Eyebrow({ children, color = C.tomate }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'inline-block', position: 'relative', paddingBottom: 8, marginBottom: 14 }}>
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color,
      }}>
        {children}
      </span>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: 28, height: 3, background: color }} />
    </div>
  )
}

export default function ParentHomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [parentName, setParentName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { getSupabase } = await import('@/lib/supabase/client')
        const supabase = getSupabase()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: parentProfile } = await supabase
          .from('users').select('role, email, name').eq('id', user.id).maybeSingle()
        if (!parentProfile || parentProfile.role !== 'parent') {
          router.push('/home'); return
        }
        setParentName((parentProfile.name as string) ?? '')

        const { data: student, error: err } = await supabase
          .from('users')
          .select('name, education_level, bac_series, education_branches, intent_level, intent_score, wishlist, last_dwell_minutes')
          .eq('parent_email', parentProfile.email)
          .maybeSingle()

        if (err) throw err
        if (!student) {
          setError("Aucun profil étudiant n'est lié à votre adresse email.")
          return
        }
        setProfile(student as StudentProfile)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleLogout() {
    const { getSupabase } = await import('@/lib/supabase/client')
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.blanc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.tomate}`, borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const intentColor = profile ? (INTENT_COLOR[profile.intent_level] ?? C.gray500) : C.gray500
  const intentLabel = profile ? (INTENT_LABEL[profile.intent_level] ?? 'Explorateur') : ''
  const firstName = parentName.split(' ')[0] || 'Parent'

  return (
    <div style={{ minHeight: '100vh', background: C.blanc, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MultiStripe />

      {/* Header */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1.5px solid ${C.gray200}`,
        background: '#fff',
      }}>
        <Logo variant="default" size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/parent/orientation" style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.piscine,
            textDecoration: 'none',
            padding: '8px 14px',
            border: `1.5px solid ${C.piscine}`,
            borderRadius: 2,
          }}>
            Guide orientation →
          </a>
          <button onClick={handleLogout} style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.gray500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}>
            Déconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px' }}>
        {/* Hero */}
        <section style={{
          background: C.nuit,
          color: '#fff',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: C.citron,
            marginBottom: 16,
          }}>
            Espace parent — 2026
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
          }}>
            Bonjour,
            <br />
            <span style={{ fontStyle: 'italic', color: C.citron }}>{firstName}</span>.
          </h1>
          <p style={{ margin: '24px 0 0', fontSize: 16, lineHeight: 1.6, maxWidth: 520, opacity: 0.85 }}>
            Suivez le parcours d&apos;orientation de votre enfant au salon L&apos;Étudiant.
          </p>

          {/* Ghost type */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            bottom: -60,
            right: -20,
            fontSize: 280,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.05)',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            pointerEvents: 'none',
          }}>
            family.
          </div>
        </section>

        {error ? (
          <div style={{
            padding: '20px 24px',
            background: C.tomateLight,
            border: `1.5px solid ${C.tomate}`,
            borderLeft: `6px solid ${C.tomate}`,
            color: C.tomate,
            fontSize: 14,
            fontWeight: 600,
          }}>
            {error}
          </div>
        ) : profile ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            {/* Identity + Intent Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Identity card */}
              <div style={{
                background: '#fff',
                border: `1.5px solid ${C.gray200}`,
                borderTop: `6px solid ${C.tomate}`,
                padding: 32,
              }}>
                <Eyebrow color={C.tomate}>Votre enfant</Eyebrow>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    background: C.tomate,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    letterSpacing: '-0.05em',
                  }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: C.nuit,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}>
                      {profile.name}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: C.gray500, fontWeight: 600 }}>
                      {profile.education_level ?? 'Niveau non renseigné'}
                      {profile.bac_series ? ` · ${profile.bac_series}` : ''}
                    </div>
                  </div>
                </div>

                {/* Intent tier */}
                <div style={{
                  padding: 20,
                  background: C.gray100,
                  borderLeft: `4px solid ${intentColor}`,
                }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: C.gray500,
                    marginBottom: 8,
                  }}>
                    Stade d&apos;orientation
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: intentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    marginBottom: 16,
                  }}>
                    {intentLabel}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    <span>Score d&apos;intention</span>
                    <span style={{ color: C.nuit }}>{profile.intent_score} / 100</span>
                  </div>
                  <div style={{ height: 6, background: '#fff', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${profile.intent_score}%`,
                      background: intentColor,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              </div>

              {/* Dwell time */}
              {profile.last_dwell_minutes != null && (
                <div style={{
                  background: '#fff',
                  border: `1.5px solid ${C.gray200}`,
                  borderLeft: `6px solid ${C.menthe}`,
                  padding: 32,
                }}>
                  <Eyebrow color={C.menthe}>Dernier salon</Eyebrow>
                  <div style={{
                    fontSize: 64,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: C.nuit,
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                  }}>
                    {Math.floor(profile.last_dwell_minutes / 60)}h{String(profile.last_dwell_minutes % 60).padStart(2, '0')}
                  </div>
                  <p style={{ marginTop: 12, fontSize: 13, color: C.gray500, fontWeight: 500 }}>
                    Temps mesuré entre le scan d&apos;entrée et le scan de sortie.
                  </p>
                </div>
              )}
            </div>

            {/* Interests + Wishlist Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {profile.education_branches.length > 0 && (
                <div style={{
                  background: '#fff',
                  border: `1.5px solid ${C.gray200}`,
                  borderLeft: `6px solid ${C.piscine}`,
                  padding: 32,
                }}>
                  <Eyebrow color={C.piscine}>Domaines déclarés</Eyebrow>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.education_branches.map((b, i) => {
                      const palette = [C.tomate, C.piscine, C.menthe, C.pourpre, C.spirit, C.framboise, C.tropical]
                      const color = palette[i % palette.length]
                      return (
                        <span key={b} style={{
                          padding: '8px 14px',
                          border: `1.5px solid ${color}`,
                          color,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}>
                          {b}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {profile.wishlist && profile.wishlist.length > 0 && (
                <div style={{
                  background: '#fff',
                  border: `1.5px solid ${C.gray200}`,
                  borderLeft: `6px solid ${C.citron}`,
                  padding: 32,
                }}>
                  <Eyebrow color={C.tomate}>Établissements sauvegardés</Eyebrow>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {profile.wishlist.map((school, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 0',
                        borderBottom: i === profile.wishlist.length - 1 ? 'none' : `1px solid ${C.gray200}`,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          background: C.tomateLight,
                          color: C.tomate,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 900,
                          fontStyle: 'italic',
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <span style={{ fontSize: 14, color: C.nuit, fontWeight: 600 }}>{school}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy notice */}
              <div style={{
                background: C.nuit,
                color: '#fff',
                padding: 24,
                position: 'relative',
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: C.citron,
                  marginBottom: 10,
                }}>
                  Confidentialité
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>
                  Seuls le niveau, les domaines, les établissements sauvegardés et le temps de présence sont partagés.
                  Les données comportementales détaillées restent privées.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
