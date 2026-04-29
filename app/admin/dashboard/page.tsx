'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { EventRow } from '@/lib/supabase/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  CartesianGrid, Legend, ReferenceLine, Cell,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE — matches Utilisateurs / Paramètres / Salons pages
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  tomate: '#EC1F27', tomateDark: '#C41520', tomateLight: '#FFF0F1',
  piscine: '#0066CC', piscineLight: '#E6F0FF',
  citron: '#FCD716', citronLight: '#FFF9E6',
  spirit: '#FF6B35', spiritLight: '#FFF0E6',
  menthe: '#4DB8A8', mentheLight: '#E0F2EF',
  pourpre: '#932D99', pourpreLight: '#F3E5F5',
  nuit: '#2B1B4D',
  blanc: '#F8F7F2',
  gray900: '#191829', gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray300: '#D4D4D4', gray200: '#E8E8E8', gray100: '#F4F4F4',
} as const

const TIER_COLORS = {
  high: { color: C.tomate, light: C.tomateLight, label: 'Décideurs' },
  medium: { color: C.piscine, light: C.piscineLight, label: 'Comparateurs' },
  low: { color: C.citron, light: C.citronLight, label: 'Explorateurs' },
} as const

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const pct = (n: number, total: number) => total === 0 ? '0' : (n / total * 100).toFixed(1).replace('.', ',')

type Tab = 'preparation' | 'jourj' | 'bilan' | 'clusters'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface EventKPI {
  event_id: string; event_name: string; city: string; event_date: string
  total_students: number; booth_registered: number; app_registered: number
  entered: number; exited: number; total_stand_scans: number; total_conf_scans: number
  deciding_count: number; comparing_count: number; exploring_count: number
  pre_registrations_total: number; pre_registrations_resolved: number
  teacher_groups: number; group_members_total: number
  total_appointments: number; confirmed_appointments: number
}
interface StandPerf {
  stand_id: string; event_id: string; school_name: string; school_type: string
  scan_count: number; unique_visitors: number
  morning_scans: number; lunch_scans: number; afternoon_scans: number
  swipe_rights: number; appointments: number
}
interface HourlyScan { event_id: string; scan_hour: string; channel: string; scan_count: number; unique_users: number }
interface FunnelRow { event_id: string; registered: number; entered: number; scanned_stand: number; swiped_right: number; booked_rdv: number }
interface FieldInterest { event_id: string; branch: string; student_count: number; pct_of_attendees: number }
interface LeadQuality { school_id: string; school_name: string; total_leads: number; deciding_leads: number; comparing_leads: number; exploring_leads: number; avg_score: number }
interface PreregFunnel { event_id: string; total_preregistered: number; resolved: number; unresolved: number; resolution_rate_pct: number; resolved_and_entered: number }

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  const accentColor = accent ?? C.nuit
  return (
    <div className="le-kpi-card" style={{
      padding: '20px 22px',
      position: 'relative' as const,
    }}>
      <div style={{
        position: 'absolute' as const, top: 0, left: 0, width: 3, height: '100%',
        background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}99 100%)`,
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase' as const, color: accentColor, marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontSize: 28, fontWeight: 800, color: C.nuit,
        letterSpacing: '-0.02em', lineHeight: 1, marginBottom: sub ? 6 : 0,
      }}>{typeof value === 'number' ? fmt(value) : value}</div>
      {sub && <div style={{ fontSize: 12, color: C.gray500, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.02em',
        color: C.nuit, margin: '0 0 4px',
      }}>{children}</h2>
      <div style={{ width: 40, height: 3, background: `linear-gradient(135deg, ${C.tomate} 0%, ${C.spirit} 100%)`, borderRadius: 999 }} />
    </div>
  )
}

function Card({ children, style, elevated = false }: { children: React.ReactNode; style?: React.CSSProperties; elevated?: boolean }) {
  return (
    <div className={elevated ? 'le-surface-elevated' : 'le-dash-card'} style={{
      padding: '24px 28px', ...style,
    }}>{children}</div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: '40px 20px', textAlign: 'center' as const, color: C.gray500, fontSize: 14 }}>{text}</div>
}

const tooltipStyle = {
  contentStyle: { background: '#fff', border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13 },
  labelStyle: { fontWeight: 700, color: C.nuit },
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('preparation')
  const [events, setEvents] = useState<EventRow[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Data states
  const [kpis, setKpis] = useState<EventKPI | null>(null)
  const [stands, setStands] = useState<StandPerf[]>([])
  const [hourly, setHourly] = useState<HourlyScan[]>([])
  const [funnel, setFunnel] = useState<FunnelRow | null>(null)
  const [fields, setFields] = useState<FieldInterest[]>([])
  const [leadQuality, setLeadQuality] = useState<LeadQuality[]>([])
  const [prereg, setPrereg] = useState<PreregFunnel | null>(null)
  const [apptAgg, setApptAgg] = useState<{ status: string; count: number }[]>([])
  const [clusters, setClusters] = useState<{ level: string; count: number; avgScore: number; avgDwell: number; avgStands: number; rdvPct: number; topBranches: { name: string; pct: number }[] }[]>([])

  // ─── Load events ───
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
        const list = data ?? []
        setEvents(list)
        if (list.length > 0) setSelectedEvent(list[0])
        else setLoading(false)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur')
        setLoading(false)
      }
    })()
  }, [])

  // ─── Load data ───
  const loadData = useCallback(async (eventId: string, currentTab: Tab, isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const supabase = getSupabase()

      // Always load KPIs
      const { data: kpiData } = await supabase.from('v_event_kpis' as 'events').select('*').eq('event_id', eventId).maybeSingle()
      if (kpiData) setKpis(kpiData as unknown as EventKPI)

      if (currentTab === 'preparation') {
        const [preregRes, fieldRes] = await Promise.all([
          supabase.from('v_prereg_funnel' as 'events').select('*').eq('event_id', eventId).maybeSingle(),
          supabase.from('v_field_interest' as 'events').select('*').eq('event_id', eventId).order('student_count', { ascending: false }).limit(10),
        ])
        setPrereg(preregRes.data as unknown as PreregFunnel | null)
        setFields((fieldRes.data ?? []) as unknown as FieldInterest[])
      }

      if (currentTab === 'jourj') {
        const [standRes, hourlyRes, funnelRes] = await Promise.all([
          supabase.from('v_stand_performance' as 'events').select('*').eq('event_id', eventId).order('scan_count', { ascending: false }).limit(15),
          supabase.from('v_hourly_scans' as 'events').select('*').eq('event_id', eventId).order('scan_hour', { ascending: true }),
          supabase.from('v_engagement_funnel' as 'events').select('*').eq('event_id', eventId).maybeSingle(),
        ])
        setStands((standRes.data ?? []) as unknown as StandPerf[])
        setHourly((hourlyRes.data ?? []) as unknown as HourlyScan[])
        setFunnel(funnelRes.data as unknown as FunnelRow | null)
      }

      if (currentTab === 'bilan') {
        const [leadRes, standRes, apptRes] = await Promise.all([
          supabase.from('v_lead_quality_by_school' as 'events').select('*').eq('event_id', eventId).order('total_leads', { ascending: false }).limit(15),
          supabase.from('v_stand_performance' as 'events').select('*').eq('event_id', eventId).order('scan_count', { ascending: false }),
          supabase.from('appointments').select('status').eq('event_id', eventId),
        ])
        setLeadQuality((leadRes.data ?? []) as unknown as LeadQuality[])
        setStands((standRes.data ?? []) as unknown as StandPerf[])
        const apptMap: Record<string, number> = {}
        ;(apptRes.data ?? []).forEach((a: { status: string }) => { apptMap[a.status] = (apptMap[a.status] ?? 0) + 1 })
        setApptAgg(Object.entries(apptMap).map(([status, count]) => ({ status, count })))
      }

      if (currentTab === 'clusters') {
        const { data: students } = await supabase
          .from('users')
          .select('id, intent_level, intent_score, last_dwell_minutes, education_branches')
          .eq('role', 'student')

        const { data: entryScans } = await supabase
          .from('scans').select('user_id').eq('event_id', eventId).eq('channel', 'entry')

        const { data: standScans } = await supabase
          .from('scans').select('user_id').eq('event_id', eventId).eq('channel', 'stand')

        const { data: appointments } = await supabase
          .from('appointments').select('student_id, status').eq('event_id', eventId)

        const entrySet = new Set((entryScans ?? []).map(s => s.user_id))
        const attendees = (students ?? []).filter(s => entrySet.has(s.id))
        const standMap: Record<string, number> = {}
        ;(standScans ?? []).forEach(s => { standMap[s.user_id] = (standMap[s.user_id] ?? 0) + 1 })
        const apptSet = new Set((appointments ?? []).filter(a => a.status !== 'cancelled').map(a => a.student_id))

        const clusterMap: Record<string, { users: typeof attendees; stands: number[]; dwells: number[]; rdv: number; branches: Record<string, number> }> = {
          high: { users: [], stands: [], dwells: [], rdv: 0, branches: {} },
          medium: { users: [], stands: [], dwells: [], rdv: 0, branches: {} },
          low: { users: [], stands: [], dwells: [], rdv: 0, branches: {} },
        }

        attendees.forEach(u => {
          const lvl = u.intent_level ?? 'low'
          const c = clusterMap[lvl]
          if (!c) return
          c.users.push(u)
          c.stands.push(standMap[u.id] ?? 0)
          c.dwells.push(u.last_dwell_minutes ?? 0)
          if (apptSet.has(u.id)) c.rdv++
          ;(u.education_branches ?? []).forEach((b: string) => { c.branches[b] = (c.branches[b] ?? 0) + 1 })
        })

        setClusters(['high', 'medium', 'low'].map(level => {
          const c = clusterMap[level]
          const n = c.users.length || 1
          return {
            level, count: c.users.length,
            avgScore: Math.round(c.users.reduce((s, u) => s + (u.intent_score ?? 0), 0) / n),
            avgDwell: Math.round(c.dwells.reduce((s, d) => s + d, 0) / n),
            avgStands: Math.round(c.stands.reduce((s, d) => s + d, 0) / n * 10) / 10,
            rdvPct: Math.round(c.rdv / n * 100),
            topBranches: Object.entries(c.branches).sort((a, b) => b[1] - a[1]).slice(0, 3)
              .map(([name, count]) => ({ name, pct: Math.round(count / n * 100) })),
          }
        }))
      }

      setLastRefresh(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEvent) loadData(selectedEvent.id, tab)
  }, [selectedEvent, tab, loadData])

  // Auto-refresh for Jour J
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (tab === 'jourj' && selectedEvent) {
      intervalRef.current = setInterval(() => loadData(selectedEvent.id, 'jourj', true), 30_000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tab, selectedEvent, loadData])

  // Time since refresh
  const [timeSince, setTimeSince] = useState('0s')
  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.round((Date.now() - lastRefresh.getTime()) / 1000)
      setTimeSince(diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}min`)
    }, 1000)
    return () => clearInterval(id)
  }, [lastRefresh])

  // Computed
  const totalLeads = (kpis?.deciding_count ?? 0) + (kpis?.comparing_count ?? 0) + (kpis?.exploring_count ?? 0)

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Subtle multi-color top accent (épuré) */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${C.tomate} 0 16.66%, ${C.piscine} 16.66% 33.33%, ${C.citron} 33.33% 50%, ${C.spirit} 50% 66.66%, ${C.menthe} 66.66% 83.33%, ${C.pourpre} 83.33% 100%)`,
        opacity: 0.85,
        borderRadius: 4,
        margin: '0 0 4px',
      }} />

      <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }} className="le-fade-in">
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(236,31,39,0.08)', color: C.tomate, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.tomate, animation: 'lePulseDot 1.8s var(--ease-smooth) infinite' }} />
            Administration · Pilotage 2026
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 20, marginBottom: 28 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900,
                color: C.nuit, lineHeight: 0.95, letterSpacing: '-0.03em',
              }}>
                Tableau de <span className="le-text-gradient">bord</span>
              </h1>
              <p style={{ margin: '16px 0 0', fontSize: 16, color: C.gray700, maxWidth: 600, lineHeight: 1.6 }}>
                Pilotage en temps réel des <strong style={{ color: C.nuit }}>salons L&apos;Étudiant</strong> — 130 événements à travers la France
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, color: C.gray500, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: '#fff',
                border: `1px solid rgba(16,24,40,0.06)`,
                borderRadius: 999, boxShadow: 'var(--shadow-xs)',
              }}>
                <span className="le-live-dot" />
                {refreshing ? 'Synchronisation…' : `Mis à jour il y a ${timeSince}`}
              </span>
              {events.length > 0 && (
                <select value={selectedEvent?.id ?? ''} onChange={e => {
                  const ev = events.find(x => x.id === e.target.value)
                  if (ev) setSelectedEvent(ev)
                }} style={{
                  padding: '10px 14px', border: `1px solid rgba(16,24,40,0.08)`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14, background: '#fff', color: C.nuit, fontWeight: 600, cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
                }}>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {ev.city} ({new Date(ev.event_date).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Feature Pills */}
          <div className="le-feature-grid" style={{ margin: '24px 0 0' }}>
            {[
              { icon: '📊', label: 'Analytics temps réel' },
              { icon: '👥', label: 'Gestion des visiteurs' },
              { icon: '🎯', label: 'Clusters intelligence' },
              { icon: '📅', label: 'Salons multiples' },
            ].map(f => (
              <div key={f.label} className="le-feature-pill">
                <span>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            padding: '14px 16px', background: 'rgba(236,31,39,0.08)', color: '#C41520',
            border: '1px solid rgba(236,31,39,0.24)', borderLeft: `3px solid ${C.tomate}`,
            borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: 14, fontWeight: 600,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              {error}
            </span>
            <button onClick={() => selectedEvent && loadData(selectedEvent.id, tab)} style={{
              background: C.tomate, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
              padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              textTransform: 'uppercase' as const, letterSpacing: '0.1em',
              transition: 'all 0.2s var(--ease-out)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(236,31,39,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>Réessayer</button>
          </div>
        )}

        {/* TAB BAR */}
        {events.length > 0 && (
          <div style={{
            display: 'inline-flex', gap: 4, marginBottom: 32,
            padding: 4, background: 'rgba(16,24,40,0.04)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16,24,40,0.04)',
          }}>
            {([
              { key: 'preparation' as Tab, label: 'Préparation' },
              { key: 'jourj' as Tab, label: 'Jour J' },
              { key: 'bilan' as Tab, label: 'Bilan' },
              { key: 'clusters' as Tab, label: 'Clusters' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`le-tab-pill${tab === t.key ? ' active' : ''}`}
              >{t.label}</button>
            ))}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: 'center' as const, padding: '80px 20px', color: C.gray500, fontSize: 14 }}>
            Chargement…
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: PRÉPARATION                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'preparation' && kpis && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28 }}>
            {/* Narrative KPIs */}
            <SectionTitle>Vue d&apos;ensemble</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <StatCard label="Pré-inscrits" value={prereg?.total_preregistered ?? 0}
                sub="Via EventMaker" accent={C.nuit} />
              <StatCard label="Profils complétés" value={prereg?.resolved ?? 0}
                sub={prereg ? `${prereg.resolution_rate_pct ?? 0}% de résolution` : undefined} accent={C.piscine} />
              <StatCard label="Groupes enseignants" value={kpis.teacher_groups}
                sub={`${fmt(kpis.group_members_total)} élèves`} accent={C.menthe} />
              <StatCard label="Inscrits via l'app" value={kpis.app_registered}
                accent={C.tomate} />
            </div>

            {/* Funnel visuel */}
            {prereg && prereg.total_preregistered > 0 && (
              <Card>
                <SectionTitle>Entonnoir d&apos;inscription</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {[
                    { label: 'Pré-inscrits EventMaker', value: prereg.total_preregistered, color: C.gray500 },
                    { label: 'Profil complété dans l\'app', value: prereg.resolved, color: C.piscine },
                    { label: 'Confirmé présent au salon', value: prereg.resolved_and_entered, color: C.menthe },
                  ].map((step, i) => {
                    const maxVal = prereg.total_preregistered || 1
                    return (
                      <div key={step.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: C.gray700 }}>{step.label}</span>
                          <span style={{ fontWeight: 800, color: step.color }}>{fmt(step.value)}</span>
                        </div>
                        <div style={{ height: 24, background: C.gray100, borderRadius: 2, position: 'relative' as const }}>
                          <div style={{
                            height: '100%', width: `${Math.max(3, (step.value / maxVal) * 100)}%`,
                            background: step.color, borderRadius: 2, opacity: 0.85,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{pct(step.value, maxVal)}%</span>
                          </div>
                        </div>
                        {i > 0 && (
                          <div style={{ fontSize: 11, color: C.gray500, textAlign: 'right' as const, marginTop: 2 }}>
                            Conversion : {pct(step.value, [prereg.total_preregistered, prereg.resolved][i - 1])}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Ce qu'ils cherchent */}
            {fields.length > 0 && (
              <Card>
                <SectionTitle>Ce que les visiteurs cherchent</SectionTitle>
                <ResponsiveContainer width="100%" height={Math.max(200, fields.length * 36)}>
                  <BarChart data={fields} layout="vertical" margin={{ left: 140, right: 40, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: C.gray500 }} />
                    <YAxis type="category" dataKey="branch" tick={{ fontSize: 12, fill: C.gray700 }} width={130} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'Étudiants']} />
                    <Bar dataKey="student_count" radius={[0, 4, 4, 0]} barSize={20}>
                      {fields.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? C.tomate : i < 3 ? C.piscine : C.gray500} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: JOUR J                                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'jourj' && kpis && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28 }}>
            <SectionTitle>Temps réel</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <StatCard label="Présents" value={kpis.entered} accent={C.menthe} />
              <StatCard label="Scans stands" value={kpis.total_stand_scans} accent={C.piscine} />
              <StatCard label="Conférences" value={kpis.total_conf_scans} accent={C.spirit} />
              <StatCard label="RDV confirmés" value={kpis.confirmed_appointments}
                sub={`${fmt(kpis.total_appointments)} au total`} accent={C.tomate} />
            </div>

            {/* Fréquentation horaire */}
            <Card>
              <SectionTitle>Fréquentation horaire</SectionTitle>
              {hourly.length === 0 ? <EmptyState text="Aucun scan enregistré" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={(() => {
                    const map: Record<string, { hour: string; entry: number; stand: number; conference: number }> = {}
                    hourly.forEach(h => {
                      const hour = new Date(h.scan_hour).getHours() + 'h'
                      if (!map[hour]) map[hour] = { hour, entry: 0, stand: 0, conference: 0 }
                      const ch = h.channel as 'entry' | 'stand' | 'conference'
                      if (ch in map[hour]) map[hour][ch] += h.scan_count
                    })
                    return Object.values(map).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
                  })()} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                    <XAxis dataKey="hour" tick={{ fontSize: 12, fill: C.gray500 }} />
                    <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                    <Tooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="entry" name="Entrées" stackId="1" stroke={C.tomate} fill={C.tomate} fillOpacity={0.3} />
                    <Area type="monotone" dataKey="stand" name="Stands" stackId="1" stroke={C.piscine} fill={C.piscine} fillOpacity={0.3} />
                    <Area type="monotone" dataKey="conference" name="Conférences" stackId="1" stroke={C.citron} fill={C.citron} fillOpacity={0.3} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine x={new Date().getHours() + 'h'} stroke={C.tomate} strokeDasharray="4 4"
                      label={{ value: 'Maintenant', fill: C.tomate, fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Top stands + Funnel side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Card>
                <SectionTitle>Top stands</SectionTitle>
                {stands.length === 0 ? <EmptyState text="Aucun stand scanné" /> : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {stands.slice(0, 10).map((s, i) => {
                      const max = stands[0]?.scan_count || 1
                      return (
                        <div key={s.stand_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 2, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0,
                            background: i < 3 ? C.nuit : C.gray100, color: i < 3 ? '#fff' : C.gray500,
                          }}>{i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.nuit }}>{s.school_name}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: C.tomate }}>{fmt(s.scan_count)}</span>
                            </div>
                            <div style={{ height: 4, background: C.gray100, borderRadius: 2 }}>
                              <div style={{
                                width: `${(s.scan_count / max) * 100}%`, height: '100%', borderRadius: 2,
                                background: i < 3 ? C.tomate : C.piscine,
                              }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              <Card>
                <SectionTitle>Entonnoir d&apos;engagement</SectionTitle>
                {!funnel ? <EmptyState text="Aucune donnée" /> : (() => {
                  const steps = [
                    { label: 'Inscrits', value: funnel.registered, color: C.gray500 },
                    { label: 'Entrés', value: funnel.entered, color: C.piscine },
                    { label: 'Stand scanné', value: funnel.scanned_stand, color: C.spirit },
                    { label: 'Swipe droit', value: funnel.swiped_right, color: C.tomate },
                    { label: 'RDV pris', value: funnel.booked_rdv, color: C.menthe },
                  ]
                  const maxVal = steps[0]?.value || 1
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      {steps.map((s) => (
                        <div key={s.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: C.gray700 }}>{s.label}</span>
                            <span style={{ fontWeight: 800, color: s.color }}>{fmt(s.value)}</span>
                          </div>
                          <div style={{ height: 22, background: C.gray100, borderRadius: 2 }}>
                            <div style={{
                              height: '100%', width: `${Math.max(3, (s.value / maxVal) * 100)}%`,
                              background: s.color, borderRadius: 2, opacity: 0.85,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: BILAN                                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'bilan' && kpis && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28 }}>
            <SectionTitle>Résultats du salon</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <StatCard label="Total leads" value={totalLeads} accent={C.tomate} />
              <StatCard label="Décideurs" value={kpis.deciding_count}
                sub={`${pct(kpis.deciding_count, totalLeads)}% du total`} accent={C.tomate} />
              <StatCard label="Comparateurs" value={kpis.comparing_count}
                sub={`${pct(kpis.comparing_count, totalLeads)}% du total`} accent={C.piscine} />
              <StatCard label="RDV honorés" value={(() => {
                const attended = apptAgg.find(a => a.status === 'attended')?.count ?? 0
                const confirmed = apptAgg.find(a => a.status === 'confirmed')?.count ?? 0
                return `${fmt(attended + confirmed)}/${fmt(apptAgg.reduce((s, a) => s + a.count, 0))}`
              })()} accent={C.menthe} />
            </div>

            {/* Lead quality table — THE key deliverable for schools */}
            {leadQuality.length > 0 && (
              <Card>
                <SectionTitle>Performance par école</SectionTitle>
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F4F3EE 100%)' }}>
                        {['École', 'Leads', 'Décideurs', 'Comparateurs', 'Explorateurs', 'Score moy.'].map(h => (
                          <th key={h} style={{
                            padding: '14px 16px', textAlign: h === 'École' ? 'left' as const : 'right' as const,
                            fontWeight: 700, color: C.gray700, fontSize: 10,
                            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                            borderBottom: `1px solid rgba(16,24,40,0.06)`,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leadQuality.map((l, i) => (
                        <tr key={l.school_id} style={{
                          borderBottom: `1px solid ${C.gray200}`,
                          background: i < 3 ? C.tomateLight : '#fff',
                        }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: C.nuit }}>{l.school_name}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' as const, fontWeight: 800, color: C.nuit }}>{fmt(l.total_leads)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' as const, fontWeight: 700, color: C.tomate }}>{fmt(l.deciding_leads)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' as const, color: C.piscine }}>{fmt(l.comparing_leads)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' as const, color: C.gray500 }}>{fmt(l.exploring_leads)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' as const, fontWeight: 700, color: C.nuit }}>
                            {l.avg_score ? `${Math.round(l.avg_score)}/100` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Lead distribution bar chart */}
            {leadQuality.length > 0 && (
              <Card>
                <SectionTitle>Leads par école</SectionTitle>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={leadQuality.slice(0, 12)} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                    <XAxis dataKey="school_name" tick={{ fontSize: 10, fill: C.gray500, angle: -35, textAnchor: 'end' }} interval={0} height={80} />
                    <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="deciding_leads" name="Décideurs" stackId="a" fill={C.tomate} barSize={28} />
                    <Bar dataKey="comparing_leads" name="Comparateurs" stackId="a" fill={C.piscine} />
                    <Bar dataKey="exploring_leads" name="Explorateurs" stackId="a" fill={C.citron} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: CLUSTERS                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'clusters' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28 }}>
            <SectionTitle>Segments comportementaux</SectionTitle>

            {/* 3 segment cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {clusters.map(c => {
                const tier = TIER_COLORS[c.level as keyof typeof TIER_COLORS] ?? TIER_COLORS.low
                const totalC = clusters.reduce((s, x) => s + x.count, 0) || 1
                return (
                  <div key={c.level} className="le-kpi-card" style={{
                    padding: '24px',
                    position: 'relative' as const,
                  }}>
                    <div style={{
                      position: 'absolute' as const, top: 0, left: 0, width: 3, height: '100%',
                      background: `linear-gradient(180deg, ${tier.color} 0%, ${tier.color}99 100%)`,
                      borderRadius: '3px 0 0 3px',
                    }} />
                    <div style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const, color: tier.color, marginBottom: 8,
                    }}>{tier.label}</div>
                    <div style={{
                      fontSize: 36, fontWeight: 900, color: C.nuit,
                      letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4,
                    }}>
                      {fmt(c.count)}
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.gray500, marginLeft: 8 }}>
                        ({pct(c.count, totalC)}%)
                      </span>
                    </div>

                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px',
                      fontSize: 13, color: C.gray700, marginTop: 16,
                      paddingTop: 16, borderTop: `1px solid ${C.gray200}`,
                    }}>
                      <div>Score moy. <strong style={{ display: 'block', fontSize: 18, color: C.nuit }}>{c.avgScore}</strong></div>
                      <div>Durée moy. <strong style={{ display: 'block', fontSize: 18, color: C.nuit }}>
                        {c.avgDwell > 60 ? `${Math.floor(c.avgDwell / 60)}h${String(c.avgDwell % 60).padStart(2, '0')}` : `${c.avgDwell}min`}
                      </strong></div>
                      <div>Stands moy. <strong style={{ display: 'block', fontSize: 18, color: C.nuit }}>{c.avgStands}</strong></div>
                      <div>Taux RDV <strong style={{ display: 'block', fontSize: 18, color: C.nuit }}>{c.rdvPct}%</strong></div>
                    </div>

                    {c.topBranches.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.gray200}` }}>
                        <div style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                          textTransform: 'uppercase' as const, color: C.gray500, marginBottom: 6,
                        }}>Top filières</div>
                        {c.topBranches.map(b => (
                          <div key={b.name} style={{ fontSize: 12, color: C.gray700, marginBottom: 2 }}>
                            {b.name} <strong>({b.pct}%)</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Simple bar chart comparing segments */}
            {clusters.length > 0 && clusters.some(c => c.count > 0) && (
              <Card>
                <SectionTitle>Comparaison des segments</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { metric: 'Score moyen', ...Object.fromEntries(clusters.map(c => [TIER_COLORS[c.level as keyof typeof TIER_COLORS]?.label ?? c.level, c.avgScore])) },
                    { metric: 'Stands visités', ...Object.fromEntries(clusters.map(c => [TIER_COLORS[c.level as keyof typeof TIER_COLORS]?.label ?? c.level, c.avgStands])) },
                    { metric: 'Taux RDV (%)', ...Object.fromEntries(clusters.map(c => [TIER_COLORS[c.level as keyof typeof TIER_COLORS]?.label ?? c.level, c.rdvPct])) },
                    { metric: 'Durée (min)', ...Object.fromEntries(clusters.map(c => [TIER_COLORS[c.level as keyof typeof TIER_COLORS]?.label ?? c.level, c.avgDwell])) },
                  ]} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                    <XAxis dataKey="metric" tick={{ fontSize: 12, fill: C.gray700 }} />
                    <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Décideurs" fill={C.tomate} barSize={24} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Comparateurs" fill={C.piscine} barSize={24} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Explorateurs" fill={C.citron} barSize={24} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  )
}