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
  orientation_stage: 'exploring' | 'comparing' | 'deciding'
  orientation_score: number
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
  const [profile,       setProfile]       = useState<StudentProfile | null>(null)
  const [wishlistNames, setWishlistNames] = useState<string[]>([])
  const [parentName,    setParentName]    = useState('')
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { getSupabase } = await import('@/lib/supabase/client')
        const supabase = getSupabase()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: parentRaw } = await supabase
          .from('users').select('role, email, name').eq('id', user.id).maybeSingle()
        const parentProfile = parentRaw as { role: string; email: string; name: string } | null
        if (!parentProfile || parentProfile.role !== 'parent') {
          router.push('/home'); return
        }
        setParentName(parentProfile.name ?? '')

        const { data: student, error: err } = await supabase
          .from('users')
          .select('name, education_level, bac_series, education_branches, intent_level, intent_score, orientation_stage, orientation_score, wishlist, last_dwell_minutes')
          .eq('parent_email', parentProfile.email)
          .maybeSingle()

        if (err) throw err
        if (!student) {
          setError("Aucun profil étudiant n'est lié à votre adresse email.")
          return
        }
        const s = student as StudentProfile
        setProfile(s)

        // Resolve wishlist: may contain school IDs (UUIDs) or plain names
        const isUUID = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
        const wishlist: string[] = s.wishlist ?? []
        const uuidItems  = wishlist.filter(isUUID)
        const nameItems  = wishlist.filter(v => !isUUID(v))

        if (uuidItems.length > 0) {
          const { data: schoolsRaw } = await supabase
            .from('schools').select('id, name').in('id', uuidItems)
          const schoolMap = new Map(((schoolsRaw ?? []) as { id: string; name: string }[]).map(sc => [sc.id, sc.name]))
          setWishlistNames([
            ...uuidItems.map(id => schoolMap.get(id) ?? id),
            ...nameItems,
          ])
        } else {
          setWishlistNames(nameItems)
        }
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
  const firstName   = parentName.split(' ')[0] || 'Parent'

  const STAGE_LABEL: Record<string, string> = { exploring: 'Explorateur', comparing: 'Comparateur', deciding: 'Décideur' }
  const STAGE_COLOR: Record<string, string> = { exploring: C.piscine, comparing: C.spirit, deciding: C.tomate }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MultiStripe />

      {/* Header */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(16,24,40,0.08)',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
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
          background: 'linear-gradient(135deg, #1F1B36 0%, #15121F 100%)',
          color: '#fff',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 32,
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.08)',
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
            background: 'rgba(236,31,39,0.08)',
            border: '1px solid rgba(236,31,39,0.24)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            color: '#C41520',
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
              <div className="le-dash-card" style={{
                padding: 32,
                position: 'relative',
                borderTop: 'none',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                  background: `linear-gradient(180deg, ${C.tomate} 0%, ${C.tomate}99 100%)`,
                  borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
                }} />
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
                  background: 'linear-gradient(135deg, rgba(16,24,40,0.04) 0%, rgba(16,24,40,0.02) 100%)',
                  border: `1px solid rgba(16,24,40,0.08)`,
                  borderRadius: 'var(--radius-lg)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: `linear-gradient(180deg, ${intentColor} 0%, ${intentColor}99 100%)`,
                    borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
                  }} />
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
                  <div style={{ height: 6, background: 'rgba(16,24,40,0.08)', overflow: 'hidden', borderRadius: 999 }}>
                    <div style={{
                      height: '100%',
                      width: `${profile.intent_score}%`,
                      background: intentColor,
                      transition: 'width 0.6s var(--ease-out)',
                      borderRadius: 999,
                    }} />
                  </div>
                </div>

                {/* Orientation stage */}
                {profile.orientation_stage && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid rgba(16,24,40,0.08)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gray500, marginBottom: 4 }}>Stade d&apos;orientation</div>
                      <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', color: STAGE_COLOR[profile.orientation_stage] ?? C.gray500, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                        {STAGE_LABEL[profile.orientation_stage] ?? profile.orientation_stage}
                      </div>
                    </div>
                    <a href="/parent/orientation" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.piscine, textDecoration: 'none', borderBottom: `1.5px solid ${C.piscine}`, paddingBottom: 1 }}>
                      Guide →
                    </a>
                  </div>
                )}
              </div>

              {/* Dwell time */}
              {profile.last_dwell_minutes != null && (
                <div className="le-dash-card" style={{
                  padding: 32,
                  position: 'relative',
                  borderLeft: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                    background: `linear-gradient(180deg, ${C.menthe} 0%, ${C.menthe}99 100%)`,
                    borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
                  }} />
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
                <div className="le-dash-card" style={{
                  padding: 32,
                  position: 'relative',
                  borderLeft: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                    background: `linear-gradient(180deg, ${C.piscine} 0%, ${C.piscine}99 100%)`,
                    borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
                  }} />
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

              {wishlistNames.length > 0 && (
                <div className="le-dash-card" style={{
                  padding: 32,
                  position: 'relative',
                  borderLeft: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                    background: `linear-gradient(180deg, ${C.citron} 0%, ${C.citron}99 100%)`,
                    borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
                  }} />
                  <Eyebrow color={C.tomate}>Établissements sauvegardés</Eyebrow>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {wishlistNames.map((school, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 0',
                        borderBottom: i === wishlistNames.length - 1 ? 'none' : '1px solid rgba(16,24,40,0.08)',
                        transition: 'all var(--trans-fast)',
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
                background: 'linear-gradient(135deg, #1F1B36 0%, #15121F 100%)',
                color: '#fff',
                padding: 24,
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid rgba(255,255,255,0.08)',
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
