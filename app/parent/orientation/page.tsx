'use client'
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const C = {
  tomate: '#EC1F27',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  piscineLight: '#E6EEF9',
  citron: '#FCD716',
  citronLight: '#FFF9DB',
  spirit: '#FF6B35',
  menthe: '#4DB8A8',
  mentheLight: '#E6F4F1',
  pourpre: '#932D99',
  nuit: '#191829',
  blanc: '#F8F7F2',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

const STRIPE_COLORS = [C.tomate, C.piscine, C.citron, C.spirit, C.menthe, C.pourpre]

const TIPS = [
  {
    phase: 'Avant le salon',
    color: C.piscine,
    bg: C.piscineLight,
    number: '01',
    subtitle: 'Préparation',
    items: [
      "Encouragez votre enfant à créer son profil sur l'app avant le salon",
      "Discutez ensemble des domaines qui l'intéressent sans imposer vos préférences",
      "Consultez ensemble les établissements présents via l'app",
      "Laissez votre enfant préparer ses questions pour les exposants",
    ],
  },
  {
    phase: 'Pendant le salon',
    color: C.tomate,
    bg: C.tomateLight,
    number: '02',
    subtitle: 'Immersion',
    items: [
      "Laissez votre enfant scanner lui-même son QR à l'entrée",
      "Privilégiez les stands qui correspondent aux intérêts déclarés",
      "Encouragez votre enfant à poser ses propres questions aux conseillers",
      "Le RDV avec un exposant est possible uniquement après le scan d'entrée",
    ],
  },
  {
    phase: 'Après le salon',
    color: C.menthe,
    bg: C.mentheLight,
    number: '03',
    subtitle: 'Décision',
    items: [
      "Consultez ensemble les établissements sauvegardés dans son profil",
      "Discutez du score d'orientation obtenu : qu'est-ce que cela révèle ?",
      "Privilégiez les vœux qui combinent intérêt, niveau et projet professionnel",
      "Contactez un conseiller d'orientation si le projet reste flou",
    ],
  },
]

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

export default function ParentOrientationPage() {
  const router = useRouter()

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
        <button onClick={() => router.back()} style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: C.gray500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}>
          ← Retour au profil
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px' }}>
        {/* Hero */}
        <section style={{
          background: C.piscine,
          color: '#fff',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 48,
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.citron }} />
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.tomate }} />
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: C.citron,
            marginBottom: 16,
          }}>
            Guide parent — 2026
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
          }}>
            Accompagner
            <br />
            <span style={{ fontStyle: 'italic', color: C.citron }}>sans diriger</span>.
          </h1>
          <p style={{ margin: '24px 0 0', fontSize: 16, lineHeight: 1.6, maxWidth: 520, opacity: 0.9 }}>
            Les bons réflexes à chaque étape, pour laisser votre enfant piloter son orientation.
          </p>

          <div aria-hidden="true" style={{
            position: 'absolute',
            bottom: -60,
            right: -20,
            fontSize: 280,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.08)',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            pointerEvents: 'none',
          }}>
            guide.
          </div>
        </section>

        {/* Section label */}
        <div style={{ marginBottom: 32 }}>
          <Eyebrow color={C.tomate}>Les 3 phases</Eyebrow>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 900,
            color: C.nuit,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            Un accompagnement <span style={{ fontStyle: 'italic', color: C.tomate }}>en trois temps</span>.
          </h2>
        </div>

        {/* Phase cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          {TIPS.map(section => (
            <div key={section.phase} style={{
              background: '#fff',
              border: `1.5px solid ${C.gray200}`,
              borderTop: `6px solid ${section.color}`,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: section.color,
                    marginBottom: 6,
                  }}>
                    {section.subtitle}
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: C.nuit,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>
                    {section.phase}
                  </h3>
                </div>
                <div style={{
                  fontSize: 56,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: section.color,
                  opacity: 0.18,
                  letterSpacing: '-0.05em',
                  lineHeight: 0.8,
                }}>
                  {section.number}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {section.items.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      background: section.bg,
                      color: section.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                      fontStyle: 'italic',
                      marginTop: 1,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 14, color: C.gray700, lineHeight: 1.5, fontWeight: 500 }}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Privacy / reassurance strip */}
        <div style={{
          background: C.nuit,
          color: '#fff',
          padding: 40,
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 32,
          alignItems: 'center',
          marginBottom: 32,
        }}>
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: C.citron,
              marginBottom: 12,
            }}>
              Bon à savoir
            </div>
            <h3 style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
            }}>
              Ses données
              <br />
              lui appartiennent.
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, opacity: 0.85 }}>
            Les données comportementales de votre enfant (stands visités, temps passé par zone, conversations avec les exposants) sont strictement confidentielles.
            Seuls les éléments qu&apos;il a choisi de partager avec vous apparaissent dans votre espace parent.
          </p>
        </div>

        {/* CTA */}
        <a href="/parent/home" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 22px',
          background: C.tomate,
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          ← Retour au profil de mon enfant
        </a>
      </main>
    </div>
  )
}
