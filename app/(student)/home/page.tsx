'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase/client'
import { trackPageView } from '@/lib/analytics/track'
import { getIntentNudge } from '@/lib/scoring/intentScore'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import ServicesBar from '@/components/features/ServicesBar'
import BoothVisit from '@/components/features/BoothVisit'
import type { EventRow, SchoolRow } from '@/lib/supabase/types'

const C = {
  tomate: '#EC1F27',
  tomateDark: '#C41520',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  piscineLight: '#E6F0FF',
  citron: '#FCD716',
  citronLight: '#FFF9E6',
  spirit: '#FF6B35',
  spiritLight: '#FFF0E6',
  menthe: '#4DB8A8',
  mentheLight: '#E0F2EF',
  pourpre: '#932D99',
  pourpreLight: '#F3E5F5',
  nuit: '#191829',
  blanc: '#F8F7F2',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

const STAGE_COLOR: Record<string, string> = {
  exploring: C.piscine,
  comparing: C.citron,
  deciding: C.menthe,
}
const STAGE_LABEL: Record<string, string> = {
  exploring: 'Exploration',
  comparing: 'Comparaison',
  deciding: 'Décision',
}

export default function StudentHomePage() {
  const { profile, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<EventRow[]>([])
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackPageView('student_home')
    async function load() {
      const supabase = getSupabase()
      const [eventsRes, schoolsRes] = await Promise.all([
        supabase.from('events').select('*').order('event_date', { ascending: true }).limit(3),
        supabase.from('schools').select('*').order('name').limit(6),
      ])
      setEvents(eventsRes.data ?? [])
      setSchools(schoolsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const firstName = profile?.name?.split(' ')[0] ?? 'Étudiant·e'
  const stage = profile?.orientation_stage ?? 'exploring'
  const nextEvent = events[0]
  const daysUntil = nextEvent
    ? Math.max(0, Math.ceil((new Date(nextEvent.event_date).getTime() - Date.now()) / 86400000))
    : null

  const intentScore = (profile as any)?.intent_score ?? 0
  const nudge = getIntentNudge(intentScore, nextEvent?.id)
  const nudgeColor = nudge.level === 'low' ? C.piscine : nudge.level === 'medium' ? C.citron : C.menthe
  const nudgeBg = nudge.level === 'low' ? C.piscineLight : nudge.level === 'medium' ? C.citronLight : C.mentheLight

  return (
    <div style={{ minHeight: '100vh', background: C.blanc, paddingBottom: 120 }}>
      {/* Signature stripe */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${C.tomate} 0 16.66%, ${C.piscine} 16.66% 33.33%, ${C.citron} 33.33% 50%, ${C.spirit} 50% 66.66%, ${C.menthe} 66.66% 83.33%, ${C.pourpre} 83.33% 100%)`,
        }}
      />

      {/* Hero */}
      <header style={{ background: C.nuit, color: '#fff', padding: '40px 20px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.tomate }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.citron }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.piscine }} />
        </div>

        {authLoading ? (
          <div style={{ height: 60 }}>
            <Skeleton className="h-5 w-40" style={{ background: 'rgba(255,255,255,0.2)' }} />
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.citron, marginBottom: 12 }}>
              Bonjour — {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2.5rem, 7vw, 4rem)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                color: '#fff',
              }}
            >
              Salut,
              <br />
              <span style={{ fontStyle: 'italic', color: C.citron }}>{firstName}</span>.
            </h1>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', border: `1px solid ${STAGE_COLOR[stage]}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLOR[stage] }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff' }}>
                Phase — {STAGE_LABEL[stage]}
              </span>
            </div>
          </>
        )}

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -80,
            right: -30,
            fontSize: 260,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.04)',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            pointerEvents: 'none',
          }}
        >
          2026
        </div>
      </header>

      <div style={{ padding: '0 20px', marginTop: -12 }}>
        {/* Next fair */}
        {loading ? (
          <Skeleton variant="card" style={{ marginBottom: 16, height: 110 }} />
        ) : nextEvent ? (
          <a
            href={`/fair/${nextEvent.id}`}
            style={{
              display: 'block',
              background: '#fff',
              borderTop: `4px solid ${C.tomate}`,
              padding: '20px',
              marginBottom: 16,
              textDecoration: 'none',
              border: `1px solid ${C.gray200}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.tomate, marginBottom: 6 }}>
                  Prochain salon
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.nuit, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 4 }}>
                  {nextEvent.name}
                </div>
                <div style={{ fontSize: 13, color: C.gray500 }}>
                  {nextEvent.city} · {new Date(nextEvent.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
              {daysUntil !== null && (
                <div style={{ textAlign: 'center', background: C.tomate, color: '#fff', padding: '12px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>{daysUntil}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
                    {daysUntil <= 1 ? 'jour' : 'jours'}
                  </div>
                </div>
              )}
            </div>
          </a>
        ) : null}

        {/* Intent nudge */}
        {!authLoading && (
          <div
            style={{
              background: nudgeBg,
              borderLeft: `6px solid ${nudgeColor}`,
              padding: '16px 18px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: nudgeColor, marginBottom: 6 }}>
                {nudge.level === 'low' ? '01 — Démarrage' : nudge.level === 'medium' ? '02 — En route' : '03 — Très actif·ve'}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.nuit, lineHeight: 1.5, fontWeight: 500 }}>{nudge.message}</p>
              <div style={{ background: 'rgba(0,0,0,0.08)', height: 3, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${nudge.progressPercent}%`, background: nudgeColor, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            {nudge.cta && nudge.ctaHref && (
              <a
                href={nudge.ctaHref}
                style={{
                  background: nudgeColor,
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {nudge.cta} →
              </a>
            )}
          </div>
        )}

        {/* Booth visit widget */}
        {nextEvent && <BoothVisit eventId={nextEvent.id} />}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Dossier', href: '/saved', color: C.tomate, glyph: '◆' },
            { label: 'Comparer', href: '/compare', color: C.piscine, glyph: '⇄' },
            { label: 'Récap', href: nextEvent ? `/recap/${nextEvent.id}` : '#', color: C.citron, glyph: '◉' },
          ].map(a => (
            <a
              key={a.href}
              href={a.href}
              style={{
                background: '#fff',
                borderTop: `3px solid ${a.color}`,
                padding: '16px 8px',
                textAlign: 'center',
                textDecoration: 'none',
                border: `1px solid ${C.gray200}`,
                borderTopWidth: 3,
              }}
            >
              <div style={{ fontSize: 24, color: a.color, marginBottom: 4, lineHeight: 1 }}>{a.glyph}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.nuit, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{a.label}</div>
            </a>
          ))}
        </div>

        {/* Services */}
        <ServicesBar eventId={nextEvent?.id} />

        {/* Upcoming events */}
        <SectionHeader eyebrow="Agenda" title="Prochains salons" color={C.tomate} />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(i => <Skeleton key={i} variant="card" style={{ height: 80 }} />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon="📅" title="Aucun salon à venir" description="Les prochains salons seront affichés ici dès leur publication." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((ev, i) => {
              const colors = [C.tomate, C.piscine, C.menthe]
              const color = colors[i % colors.length]
              return (
                <a
                  key={ev.id}
                  href={`/fair/${ev.id}`}
                  style={{
                    background: '#fff',
                    borderLeft: `4px solid ${color}`,
                    padding: '14px 16px',
                    textDecoration: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${C.gray200}`,
                    borderLeftWidth: 4,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.nuit, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 4 }}>
                      {ev.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray500 }}>
                      {ev.city} · {new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ color, fontSize: 20, fontWeight: 900 }}>→</span>
                </a>
              )
            })}
          </div>
        )}

        {/* Suggested schools */}
        <SectionHeader eyebrow="Découvrir" title="Établissements suggérés" color={C.piscine} />
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : schools.length === 0 ? (
          <EmptyState icon="🏫" title="Aucun établissement" description="Explorez les établissements dans l'onglet Découvrir." action={{ label: 'Découvrir', href: '/discover' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 20 }}>
            {schools.map((school, i) => {
              const colors = [C.tomate, C.piscine, C.citron, C.spirit, C.menthe, C.pourpre]
              const color = colors[i % colors.length]
              return (
                <a
                  key={school.id}
                  href={`/schools/${school.id}`}
                  style={{
                    background: '#fff',
                    padding: 0,
                    textDecoration: 'none',
                    border: `1px solid ${C.gray200}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 70,
                      background: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      fontWeight: 900,
                      color: '#fff',
                      fontStyle: 'italic',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {school.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.nuit, lineHeight: 1.25, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                      {school.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray500 }}>
                      {school.city} · {school.type}
                    </div>
                    {school.parcoursup && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 8,
                          background: C.piscineLight,
                          color: C.piscine,
                          padding: '3px 8px',
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          border: `1px solid ${C.piscine}`,
                        }}
                      >
                        Parcoursup
                      </span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
      <StudentBottomNav />
    </div>
  )
}

function SectionHeader({ eyebrow, title, color }: { eyebrow: string; title: string; color: string }) {
  return (
    <div style={{ margin: '32px 0 16px' }}>
      <div style={{ display: 'inline-block', position: 'relative', paddingBottom: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gray500 }}>
          {eyebrow}
        </span>
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: 22, height: 2, background: color }} />
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.nuit, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {title}
      </h2>
    </div>
  )
}
