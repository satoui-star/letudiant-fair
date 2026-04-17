'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase/client'
import { trackPageView } from '@/lib/analytics/track'
import { getIntentNudge } from '@/lib/scoring/intentScore'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import ServicesBar from '@/components/features/ServicesBar'
import type { EventRow, SchoolRow } from '@/lib/supabase/types'

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

  const firstName = profile?.name?.split(' ')[0] ?? 'Étudiant(e)'
  const stage = profile?.orientation_stage ?? 'exploring'
  const stageLabel: Record<string, string> = { exploring: 'Exploration', comparing: 'Comparaison', deciding: 'Décision' }
  const stageColor: Record<string, string> = { exploring: '#0066CC', comparing: '#f59e0b', deciding: '#22c55e' }

  const nextEvent    = events[0]
  const daysUntil    = nextEvent
    ? Math.max(0, Math.ceil((new Date(nextEvent.event_date).getTime() - Date.now()) / 86400000))
    : null

  const intentScore  = (profile as any)?.intent_score ?? 0
  const nudge        = getIntentNudge(intentScore, nextEvent?.id)

  const nudgeBg:    Record<string, string> = { low: '#EFF6FF', medium: '#FFF9E6', high: '#F0FFF4' }
  const nudgeColor: Record<string, string> = { low: '#1d4ed8', medium: '#92400e', high: '#15803d' }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#EC1F27,#C5001A)', padding: '52px 20px 28px', color: '#fff' }}>
        {authLoading ? (
          <div style={{ height: 60, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton className="h-5 w-40" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <Skeleton className="h-3 w-28" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', opacity: 0.75 }}>Bonjour 👋</p>
            <h1 style={{ margin: '0 0 10px', fontSize: '1.5rem', fontWeight: 800 }}>{firstName}</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor[stage] }} />
              {stageLabel[stage]}
            </span>
          </>
        )}
      </div>

      <div style={{ padding: '0 20px', marginTop: -16 }}>
        {/* Next fair countdown */}
        {loading ? (
          <Skeleton variant="card" style={{ marginBottom: 20, height: 100 }} />
        ) : nextEvent ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: '0.75rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prochain salon</p>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', color: '#1A1A1A' }}>{nextEvent.name}</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6B6B' }}>{nextEvent.city} · {new Date(nextEvent.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
            </div>
            {daysUntil !== null && (
              <div style={{ textAlign: 'center', background: '#FFF0F0', borderRadius: 12, padding: '10px 16px' }}>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#EC1F27', lineHeight: 1 }}>{daysUntil}</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#EC1F27', fontWeight: 600 }}>jours</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Intent nudge */}
        {!authLoading && (
          <div style={{ background: nudgeBg[nudge.level], borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', color: nudgeColor[nudge.level], fontWeight: 700 }}>
                {nudge.level === 'low' ? '🔵 Démarrage' : nudge.level === 'medium' ? '🟡 En exploration' : '🟢 Très actif(ve)'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#3D3D3D', lineHeight: 1.5 }}>{nudge.message}</p>
              <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 99, height: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${nudge.progressPercent}%`, background: nudgeColor[nudge.level], borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            {nudge.cta && nudge.ctaHref && (
              <a href={nudge.ctaHref} style={{ background: nudgeColor[nudge.level], color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {nudge.cta}
              </a>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { icon: '📁', label: 'Dossier', href: '/saved' },
            { icon: '⚖️', label: 'Comparer', href: '/compare' },
            { icon: '📋', label: 'Récap', href: nextEvent ? `/recap/${nextEvent.id}` : '#' },
          ].map(a => (
            <a key={a.href} href={a.href} style={{ background: '#fff', borderRadius: 14, padding: '16px 8px', textAlign: 'center', textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A1A1A' }}>{a.label}</div>
            </a>
          ))}
        </div>

        {/* Services */}
        <ServicesBar />

        {/* Upcoming events */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '24px 0 12px', color: '#1A1A1A' }}>Prochains salons</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2].map(i => <Skeleton key={i} variant="card" style={{ height: 80 }} />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon="📅" title="Aucun salon à venir" description="Les prochains salons seront affichés ici dès leur publication." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(ev => (
              <a key={ev.id} href={`/fair/${ev.id}`} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A' }}>{ev.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6B6B' }}>{ev.city} · {new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span style={{ color: '#EC1F27', fontSize: 18 }}>›</span>
              </a>
            ))}
          </div>
        )}

        {/* Suggested schools */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '24px 0 12px', color: '#1A1A1A' }}>Établissements suggérés</h2>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : schools.length === 0 ? (
          <EmptyState icon="🏫" title="Aucun établissement" description="Explorez les établissements dans l'onglet Découvrir." action={{ label: 'Découvrir', href: '/discover' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 20 }}>
            {schools.map(school => (
              <a key={school.id} href={`/schools/${school.id}`} style={{ background: '#fff', borderRadius: 14, padding: '14px', textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', height: 70, background: 'linear-gradient(135deg,#F0F0F0,#E8E8E8)', borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏫</div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.8125rem', color: '#1A1A1A', lineHeight: 1.3 }}>{school.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{school.city} · {school.type}</p>
                {school.parcoursup && <span style={{ display: 'inline-block', marginTop: 6, background: '#EEF2FF', color: '#0066CC', borderRadius: 6, padding: '2px 7px', fontSize: '0.6875rem', fontWeight: 600 }}>Parcoursup</span>}
              </a>
            ))}
          </div>
        )}
      </div>
      <StudentBottomNav />
    </div>
  )
}
