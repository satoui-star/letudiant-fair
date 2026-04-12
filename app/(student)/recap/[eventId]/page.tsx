'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import SectionLabel from '@/components/ui/SectionLabel'
import OrientationBadge from '@/components/ui/OrientationBadge'
import StripeRule from '@/components/ui/StripeRule'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EventInfo {
  name: string
  city: string
  event_date: string
  venue: string | null
}

interface JourneyEvent {
  id: string
  time: string
  type: 'entry' | 'stand' | 'conference' | 'exit'
  title: string
  schoolId?: string
  detail?: string
  icon: string
  tag: 'red' | 'blue' | 'yellow' | 'gray'
}

interface VisitedSchool {
  id: string
  name: string
  type: string
  color: string
}

interface MatchedSchool {
  id: string
  name: string
  score: number
  type: string
}

interface NextStep {
  priority: number
  label: string
  deadline: string | null
  done: boolean
  cta: string | null
  icon: string
}

// ─── Static data (not stored in DB) ──────────────────────────────────────────

const NEXT_STEPS_INITIAL: NextStep[] = [
  { priority: 1, label: 'Compléter votre dossier Parcoursup', deadline: '20 mars 2026', done: false, cta: 'parcoursup.fr', icon: '📋' },
  { priority: 2, label: 'Demander une lettre de recommandation', deadline: null, done: false, cta: null, icon: '✉️' },
  { priority: 3, label: 'Participer aux Journées Portes Ouvertes', deadline: null, done: false, cta: "S'inscrire", icon: '🏫' },
  { priority: 4, label: 'Prendre RDV de suivi avec un établissement', deadline: null, done: false, cta: 'Réserver', icon: '📅' },
  { priority: 5, label: "Lire : \"Préparer son dossier d'admission\"", deadline: null, done: false, cta: "Lire l'article", icon: '📖' },
]

const SCHOOL_COLORS: Record<string, string> = {
  'Grande École': '#003C8F',
  "École d'Ingénieurs": '#E6A800',
  "École d'ingénieurs": '#E6A800',
  "École d'Art": '#E3001B',
  'Université': '#003C8F',
  'IUT': '#3D3D3D',
  'École Spécialisée': '#1A1A1A',
}

const SCHOOL_ICONS: Record<string, string> = {
  'Grande École': '🏛️',
  "École d'Ingénieurs": '⚙️',
  "École d'ingénieurs": '⚙️',
  "École d'Art": '🎨',
  'Université': '🎓',
  'IUT': '🔬',
  'École Spécialisée': '💻',
}

type TabId = 'bilan' | 'documents' | 'comparer' | 'prochaines-etapes'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecapPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([])
  const [visitedSchools, setVisitedSchools] = useState<VisitedSchool[]>([])
  const [matchedSchools, setMatchedSchools] = useState<MatchedSchool[]>([])
  const [kpis, setKpis] = useState({ stands: 0, conferences: 0, dwellMin: 0 })

  const [activeTab, setActiveTab] = useState<TabId>('bilan')
  const [shared, setShared] = useState(false)
  const [nextSteps, setNextSteps] = useState<NextStep[]>(NEXT_STEPS_INITIAL)
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [compareToast, setCompareToast] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()

      // Load event info
      const { data: ev } = await supabase
        .from('events')
        .select('name, city, event_date, venue')
        .eq('id', eventId)
        .maybeSingle()
      if (ev) setEventInfo(ev as EventInfo)

      // Load scans for this user + event
      const { data: scans } = await supabase
        .from('scans')
        .select('id, channel, stand_id, session_id, dwell_estimate, created_at')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      const rows = scans ?? []

      // Collect distinct school IDs from stand scans
      const schoolIds = [...new Set(rows.filter(r => (r as any).stand_id).map(r => (r as any).stand_id))]
      let schoolMap: Record<string, { name: string; type: string }> = {}
      if (schoolIds.length > 0) {
        const { data: schools } = await supabase
          .from('schools')
          .select('id, name, type')
          .in('id', schoolIds)
        for (const s of schools ?? []) {
          schoolMap[(s as any).id] = { name: (s as any).name, type: (s as any).type }
        }
      }

      // Build journey timeline
      const events: JourneyEvent[] = rows.map((r: any) => {
        const school = r.stand_id ? schoolMap[r.stand_id] : null
        if (r.channel === 'stand') {
          return {
            id: r.id,
            time: formatTime(r.created_at),
            type: 'stand' as const,
            title: school ? `Stand ${school.name}` : `Stand #${r.stand_id}`,
            schoolId: r.stand_id ?? undefined,
            detail: r.dwell_estimate ? `~${r.dwell_estimate} min` : undefined,
            icon: school ? (SCHOOL_ICONS[school.type] ?? '🏫') : '🏫',
            tag: 'red' as const,
          }
        }
        if (r.channel === 'conference') {
          return {
            id: r.id,
            time: formatTime(r.created_at),
            type: 'conference' as const,
            title: 'Conférence',
            detail: r.dwell_estimate ? `~${r.dwell_estimate} min` : undefined,
            icon: '🎤',
            tag: 'yellow' as const,
          }
        }
        if (r.channel === 'entry') {
          return {
            id: r.id,
            time: formatTime(r.created_at),
            type: 'entry' as const,
            title: 'Entrée au salon',
            detail: ev ? `${ev.city}${ev.venue ? ` · ${ev.venue}` : ''}` : undefined,
            icon: '🚀',
            tag: 'blue' as const,
          }
        }
        return {
          id: r.id,
          time: formatTime(r.created_at),
          type: 'exit' as const,
          title: 'Sortie',
          icon: '✅',
          tag: 'gray' as const,
        }
      })
      setJourneyEvents(events)

      // KPIs
      const standScans = rows.filter((r: any) => r.channel === 'stand')
      const confScans  = rows.filter((r: any) => r.channel === 'conference')
      const totalDwell = rows.reduce((acc: number, r: any) => acc + (r.dwell_estimate ?? 0), 0)
      setKpis({ stands: standScans.length, conferences: confScans.length, dwellMin: totalDwell })

      // Visited schools list (for compare tab)
      const visited: VisitedSchool[] = schoolIds
        .filter(id => schoolMap[id])
        .map(id => ({
          id,
          name: schoolMap[id].name,
          type: schoolMap[id].type,
          color: SCHOOL_COLORS[schoolMap[id].type] ?? '#003C8F',
        }))
      setVisitedSchools(visited)
      setSelectedSchools(new Set(visited.map(s => s.id)))

      // Right-swipe matches (schools that are a mutual fit)
      const { data: matchRows } = await supabase
        .from('matches')
        .select('school_id, schools(name, type)')
        .eq('student_id', user.id)
        .eq('student_swipe', 'right')
      const matched: MatchedSchool[] = (matchRows ?? []).map((m: any) => ({
        id: m.school_id,
        name: m.schools?.name ?? 'École',
        type: m.schools?.type ?? '',
        score: 0,
      })).slice(0, 5)
      setMatchedSchools(matched)

      setLoading(false)
    }
    load()
  }, [user, eventId])

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).catch(() => null)
    }
    setShared(true)
    setTimeout(() => setShared(false), 2500)
  }

  const toggleStep = (priority: number) => {
    setNextSteps(prev => prev.map(s => s.priority === priority ? { ...s, done: !s.done } : s))
  }

  const toggleSchool = (id: string) => {
    setSelectedSchools(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const doneCnt = nextSteps.filter(s => s.done).length

  const TABS: { id: TabId; label: string }[] = [
    { id: 'bilan', label: 'Mon Bilan' },
    { id: 'documents', label: 'Documents' },
    { id: 'comparer', label: 'Comparer' },
    { id: 'prochaines-etapes', label: 'Prochaines étapes' },
  ]

  const eventDate = eventInfo?.event_date
    ? new Date(eventInfo.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const totalDwellFormatted = kpis.dwellMin >= 60
    ? `${Math.floor(kpis.dwellMin / 60)}h${kpis.dwellMin % 60 > 0 ? String(kpis.dwellMin % 60).padStart(2, '0') : ''}`
    : `${kpis.dwellMin} min`

  return (
    <div className="page-with-nav" style={{ background: 'var(--le-gray-100)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #E3001B 0%, #B0001A 60%, #003C8F 100%)',
          padding: '24px 20px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: `repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 18px)`,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <a
            href="/home"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 16 }}
          >
            ← Accueil
          </a>
          <Tag variant="gray" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: 10 }}>
            Kit After-the-Fair
          </Tag>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 4px', lineHeight: 1.2 }}>
            {loading ? 'Récapitulatif…' : `Récapitulatif — ${eventInfo?.name ?? 'Salon'}`}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: '0 0 20px' }}>
            📅 {eventDate}
            {eventInfo?.venue ? ` · ${eventInfo.venue}` : eventInfo?.city ? ` · ${eventInfo.city}` : ''}
          </p>

          {/* Tabs */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 14px', fontSize: 13, fontWeight: 600,
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StripeRule />

      {/* ── Mon Bilan ── */}
      {activeTab === 'bilan' && (
        <div>
          {/* KPIs */}
          <div style={{ padding: '20px 16px 0' }}>
            <SectionLabel>Votre journée en chiffres</SectionLabel>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
                {[1,2,3,4].map(i => <Skeleton key={i} height={80} borderRadius={12} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
                {[
                  { value: String(kpis.stands),      label: 'Stands visités',  icon: '🏢', color: 'var(--le-red)' },
                  { value: String(kpis.conferences),  label: 'Conférences',      icon: '🎤', color: 'var(--le-blue)' },
                  { value: String(matchedSchools.length), label: 'Écoles likées', icon: '❤️', color: '#16A34A' },
                  { value: kpis.dwellMin > 0 ? totalDwellFormatted : '—', label: 'Temps estimé', icon: '⏱️', color: '#7A6200' },
                ].map(kpi => (
                  <div key={kpi.label} className="kpi-card" style={{ borderLeft: `3px solid ${kpi.color}` }}>
                    <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                    <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                    <span className="kpi-label">{kpi.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Journey timeline */}
          <div style={{ padding: '24px 16px 0' }}>
            <SectionLabel>Votre parcours</SectionLabel>
            {loading ? (
              <Skeleton height={200} borderRadius={12} style={{ marginTop: 16 }} />
            ) : journeyEvents.length === 0 ? (
              <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>📭</p>
                <p style={{ fontWeight: 600, fontSize: 15, color: '#1A1A1A', margin: '0 0 6px' }}>Aucun scan enregistré</p>
                <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>
                  Scannez les QR codes des stands pour enregistrer votre parcours.
                </p>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16, background: '#fff', borderRadius: 12,
                  border: '1px solid var(--le-gray-200)', padding: '20px',
                  display: 'flex', flexDirection: 'column', gap: 0,
                }}
              >
                {journeyEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="timeline-item"
                    style={{ paddingBottom: index < journeyEvents.length - 1 ? 20 : 0 }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingLeft: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-red)', minWidth: 40, flexShrink: 0, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                        {event.time}
                      </span>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--le-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {event.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                          {event.schoolId ? (
                            <a href={`/schools/${event.schoolId}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--le-blue)', textDecoration: 'none' }}>
                              {event.title}
                            </a>
                          ) : (
                            <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: 'var(--le-gray-900)' }}>
                              {event.title}
                            </p>
                          )}
                          <Tag variant={event.tag} style={{ fontSize: 10 }}>
                            {event.type === 'stand' ? 'Stand' : event.type === 'conference' ? 'Conf.' : event.type === 'entry' ? 'Entrée' : 'Sortie'}
                          </Tag>
                        </div>
                        {event.detail && <p className="le-caption" style={{ margin: 0 }}>{event.detail}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right-swipe matches */}
          {matchedSchools.length > 0 && (
            <div style={{ padding: '24px 16px 0' }}>
              <SectionLabel>Établissements dans votre liste</SectionLabel>
              <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
                Écoles que vous avez likées — retrouvez-les dans votre dossier
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matchedSchools.map(school => (
                  <div key={school.id} className="le-card" style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: SCHOOL_COLORS[school.type] ?? '#003C8F',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: SCHOOL_COLORS[school.type] === '#E6A800' ? '#1A1A1A' : '#fff',
                        fontWeight: 700, fontSize: 16, flexShrink: 0,
                      }}
                    >
                      {SCHOOL_ICONS[school.type] ?? '🎓'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: 'var(--le-gray-900)' }}>{school.name}</p>
                      <p className="le-caption" style={{ margin: 0 }}>{school.type}</p>
                    </div>
                    <Button variant="secondary" size="sm" href={`/schools/${school.id}`} style={{ flexShrink: 0 }}>
                      Voir
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div style={{ padding: '24px 16px' }}>
            <Button variant="primary" onClick={handleShare} style={{ justifyContent: 'center', width: '100%' }}>
              {shared ? '✓ Lien copié !' : <><span style={{ fontSize: 16, marginRight: 4 }}>📤</span>Partager mon bilan</>}
            </Button>
            <p className="le-caption" style={{ textAlign: 'center', marginTop: 10 }}>
              Partagez votre récapitulatif avec vos parents ou conseillers d&apos;orientation
            </p>
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Documents collectés au salon</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
            Les brochures et plaquettes des établissements visités
          </p>

          {loading ? (
            <Skeleton height={160} borderRadius={12} />
          ) : visitedSchools.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>📂</p>
              <p style={{ fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>Aucun document pour le moment</p>
              <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>Scannez des stands pour collecter les brochures.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visitedSchools.map(school => (
                <div
                  key={school.id}
                  className="le-card"
                  style={{ borderLeft: `4px solid ${school.color}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 8, background: school.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: school.color === '#E6A800' ? '#1A1A1A' : '#fff',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}
                  >
                    {getInitials(school.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--le-gray-900)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {school.name}_Brochure_{new Date().getFullYear()}.pdf
                    </p>
                    <p className="le-caption" style={{ margin: 0 }}>{school.name} · Brochure</p>
                  </div>
                  <Button variant="ghost" size="sm" style={{ flexShrink: 0 }}>↓</Button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, paddingBottom: 16 }}>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
              📦 Télécharger tout (.zip)
            </Button>
            <Button variant="secondary" href="/saved" style={{ width: '100%', justifyContent: 'center' }}>
              Voir dans Mon Dossier →
            </Button>
          </div>
        </div>
      )}

      {/* ── Comparer ── */}
      {activeTab === 'comparer' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Comparer les établissements visités</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 16 }}>
            Sélectionnez jusqu&apos;à 3 écoles pour les comparer côte à côte
          </p>

          {loading ? (
            <Skeleton height={120} borderRadius={12} />
          ) : visitedSchools.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔍</p>
              <p style={{ fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>Aucun établissement visité</p>
              <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>Scannez des stands pour les comparer ici.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {visitedSchools.map(school => {
                  const sel = selectedSchools.has(school.id)
                  return (
                    <div
                      key={school.id}
                      className="le-card"
                      style={{
                        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                        borderLeft: sel ? `4px solid ${school.color}` : '4px solid var(--le-gray-200)',
                        cursor: 'pointer', transition: 'border-color 0.15s ease',
                      }}
                      onClick={() => toggleSchool(school.id)}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${sel ? school.color : 'var(--le-gray-200)'}`, background: sel ? school.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s ease' }}>
                        {sel && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: school.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: school.color === '#E6A800' ? '#1A1A1A' : '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {getInitials(school.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: 'var(--le-gray-900)' }}>{school.name}</p>
                        <p className="le-caption" style={{ margin: 0 }}>{school.type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--le-gray-200)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Critères de comparaison</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {["Type d'établissement", "Frais de scolarité", "Insertion professionnelle", "Alternance disponible", "Parcoursup", "Bourses"].map(c => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--le-gray-700)' }}>
                      <span style={{ color: '#16A34A', fontSize: 12 }}>✓</span>{c}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                href="/compare"
                onClick={() => { setCompareToast(true); setTimeout(() => setCompareToast(false), 2000) }}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
              >
                Lancer la comparaison ({selectedSchools.size} école{selectedSchools.size > 1 ? 's' : ''})
              </Button>
            </>
          )}

          {compareToast && (
            <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--le-gray-900)', color: '#fff', padding: '12px 22px', borderRadius: 24, fontWeight: 600, fontSize: 13, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              Chargement de la comparaison...
            </div>
          )}
        </div>
      )}

      {/* ── Prochaines étapes ── */}
      {activeTab === 'prochaines-etapes' && (
        <div style={{ padding: '20px 16px 0' }}>
          <SectionLabel>Vos prochaines étapes</SectionLabel>
          <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
            {doneCnt}/{nextSteps.length} étapes complétées
          </p>

          <div style={{ height: 6, background: 'var(--le-gray-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div
              style={{
                height: '100%', width: `${Math.round((doneCnt / nextSteps.length) * 100)}%`,
                background: 'var(--le-red)', borderRadius: 10, transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nextSteps.map(step => (
              <div key={step.priority} className="le-card" style={{ padding: '14px 16px', opacity: step.done ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <button
                    onClick={() => toggleStep(step.priority)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: step.done ? '#DCFCE7' : 'var(--le-red)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: step.done ? '#15803D' : '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}
                  >
                    {step.done ? '✓' : step.priority}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{step.icon}</span>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--le-gray-900)', margin: 0, lineHeight: 1.4, textDecoration: step.done ? 'line-through' : 'none' }}>
                        {step.label}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {step.deadline && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--le-red-light)', color: 'var(--le-red-dark)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                          ⏰ {step.deadline}
                        </span>
                      )}
                      {step.cta && !step.done && (
                        <a href="#" style={{ fontSize: 12, fontWeight: 700, color: 'var(--le-blue)', textDecoration: 'none' }}>
                          {step.cta} →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingBottom: 16 }}>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
              📧 Recevoir ces étapes par email
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
