'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { EventRow } from '@/lib/supabase/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, CartesianGrid, Legend, ReferenceLine, ScatterChart, Scatter,
  ZAxis
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  red: '#E3001B', redDark: '#B0001A', redLight: '#FDEAEA',
  blue: '#003C8F', blueLight: '#E6ECF8',
  yellow: '#FFD100', yellowLight: '#FFFBE6',
  gray900: '#1A1A1A', gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4',
  success: '#22c55e', warning: '#f59e0b',
} as const

const TIER = { deciding: C.red, comparing: C.blue, exploring: C.yellow } as const
const TIER_LIGHT = { deciding: C.redLight, comparing: C.blueLight, exploring: C.yellowLight } as const
const TIER_LABEL = { deciding: 'Décideurs', comparing: 'Comparateurs', exploring: 'Explorateurs' } as const

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const pct = (n: number, total: number) => total === 0 ? '0,0' : (n / total * 100).toFixed(1).replace('.', ',')
const pctNum = (n: number, total: number) => total === 0 ? 0 : Math.round(n / total * 1000) / 10

type Tab = 'avant' | 'pendant' | 'apres' | 'clusters'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES for analytics views
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
  stand_id: string; event_id: string; event_name: string; school_name: string
  school_city: string; school_type: string; category: string
  scan_count: number; unique_visitors: number
  morning_scans: number; lunch_scans: number; afternoon_scans: number
  swipe_rights: number; swipe_lefts: number; appointments: number
}
interface HourlyScan { event_id: string; scan_hour: string; channel: string; scan_count: number; unique_users: number }
interface FunnelRow { event_id: string; registered: number; entered: number; scanned_stand: number; swiped_right: number; booked_rdv: number }
interface EduBreakdown { event_id: string; education_level: string; bac_series: string | null; intent_level: string; student_count: number }
interface FieldInterest { event_id: string; branch: string; student_count: number; pct_of_attendees: number }
interface DwellBucket { event_id: string; dwell_bucket: string; student_count: number; avg_dwell: number }
interface LeadQuality { school_id: string; school_name: string; school_type: string; event_id: string; total_leads: number; deciding_leads: number; comparing_leads: number; exploring_leads: number; avg_score: number; avg_dwell: number }
interface GroupPerf { group_id: string; school_name: string; group_name: string; event_name: string; event_date: string; member_count: number; members_entered: number; members_scanned_stand: number }
interface PreregFunnel { event_id: string; total_preregistered: number; resolved: number; unresolved: number; resolution_rate_pct: number; resolved_and_entered: number }
interface AppointmentAgg { status: string; count: number }

// Cluster data
interface ClusterData {
  level: string; count: number; avgScore: number; avgDwell: number
  avgStands: number; rdvPct: number; topBranches: { name: string; pct: number }[]
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: '20px 22px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontFamily: "'DM Sans', sans-serif",
}
const sectionTitle: React.CSSProperties = {
  margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: C.gray900,
  fontFamily: "'DM Sans', sans-serif",
}
const captionStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: C.gray500, textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

// ═══════════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function KPICard({ label, value, sub, color = C.red, bgOverride, pulse }: {
  label: string; value: string | number; sub?: string; color?: string; bgOverride?: string; pulse?: boolean
}) {
  return (
    <div style={{ ...cardStyle, background: bgOverride ?? '#fff', position: 'relative' as const }}>
      {pulse && (
        <span style={{
          position: 'absolute' as const, top: 14, right: 14, width: 8, height: 8,
          borderRadius: '50%', background: C.red,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      <p style={{ ...captionStyle, margin: '0 0 6px' }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif" }}>
        {typeof value === 'number' ? fmt(value) : value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.gray500 }}>{sub}</p>}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' as const, color: C.gray500, fontSize: 14 }}>
      {text}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ ...cardStyle, minHeight: 100 }}>
          <div style={{ width: 80, height: 12, background: C.gray200, borderRadius: 4, marginBottom: 12 }} />
          <div style={{ width: 60, height: 28, background: C.gray200, borderRadius: 4, marginBottom: 8 }} />
          <div style={{ width: 100, height: 10, background: C.gray100, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { background: '#fff', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  labelStyle: { fontWeight: 700, color: C.gray900 },
}

// ═══════════════════════════════════════════════════════════════════════════
// SORTABLE TABLE
// ═══════════════════════════════════════════════════════════════════════════
function SortableTable({ columns, rows, defaultSortCol, highlightTop }: {
  columns: { key: string; label: string; numeric?: boolean }[]
  rows: Record<string, string | number>[]
  defaultSortCol?: string
  highlightTop?: number
}) {
  const [sortCol, setSortCol] = useState(defaultSortCol ?? columns[0]?.key ?? '')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortCol] ?? 0
    const vb = b[sortCol] ?? 0
    if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  return (
    <div style={{ overflowX: 'auto' as const }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => {
                if (sortCol === col.key) setSortAsc(!sortAsc)
                else { setSortCol(col.key); setSortAsc(false) }
              }} style={{
                textAlign: col.numeric ? 'right' as const : 'left' as const,
                padding: '10px 12px', borderBottom: `2px solid ${C.gray200}`,
                cursor: 'pointer', userSelect: 'none' as const, color: C.gray500,
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.05em', whiteSpace: 'nowrap' as const,
              }}>
                {col.label} {sortCol === col.key ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} style={{
              background: highlightTop && i < highlightTop ? C.redLight : i % 2 === 0 ? '#fff' : C.gray100,
            }}>
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: '10px 12px', borderBottom: `1px solid ${C.gray100}`,
                  textAlign: col.numeric ? 'right' as const : 'left' as const,
                  fontWeight: col.numeric ? 600 : 400, color: C.gray700,
                }}>
                  {typeof row[col.key] === 'number' ? fmt(row[col.key] as number) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('avant')
  const [events, setEvents] = useState<EventRow[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tab data states
  const [kpis, setKpis] = useState<EventKPI | null>(null)
  const [stands, setStands] = useState<StandPerf[]>([])
  const [hourly, setHourly] = useState<HourlyScan[]>([])
  const [funnel, setFunnel] = useState<FunnelRow | null>(null)
  const [eduBreakdown, setEduBreakdown] = useState<EduBreakdown[]>([])
  const [fields, setFields] = useState<FieldInterest[]>([])
  const [dwell, setDwell] = useState<DwellBucket[]>([])
  const [leadQuality, setLeadQuality] = useState<LeadQuality[]>([])
  const [groupPerf, setGroupPerf] = useState<GroupPerf[]>([])
  const [prereg, setPrereg] = useState<PreregFunnel | null>(null)
  const [apptAgg, setApptAgg] = useState<AppointmentAgg[]>([])
  const [clusters, setClusters] = useState<ClusterData[]>([])
  const [geoData, setGeoData] = useState<{ dept: string; count: number }[]>([])
  const [boothVsApp, setBoothVsApp] = useState<{ booth: { count: number; avgScore: number; avgDwell: number; decidingPct: number }; app: { count: number; avgScore: number; avgDwell: number; decidingPct: number } } | null>(null)
  const [minorStats, setMinorStats] = useState<{ total: number; approved: number; withParent: number } | null>(null)

  // ─── Load events on mount ───
  useEffect(() => {
    async function init() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
        const list = data ?? []
        setEvents(list)
        if (list.length > 0) {
          setSelectedEvent(list[0])
        } else {
          setLoading(false)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setLoading(false)
      }
    }
    init()
  }, [])

  // ─── Load tab data when event or tab changes ───
  const loadTabData = useCallback(async (eventId: string, currentTab: Tab, isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const supabase = getSupabase()

      // Always load KPIs (shared across tabs)
      const { data: kpiData } = await supabase.from('v_event_kpis' as 'events').select('*').eq('event_id', eventId).maybeSingle()
      if (kpiData) setKpis(kpiData as unknown as EventKPI)

      if (currentTab === 'avant') {
        const [preregRes, eduRes, fieldRes, groupRes] = await Promise.all([
          supabase.from('v_prereg_funnel' as 'events').select('*').eq('event_id', eventId).maybeSingle(),
          supabase.from('v_education_breakdown' as 'events').select('*').eq('event_id', eventId),
          supabase.from('v_field_interest' as 'events').select('*').eq('event_id', eventId).order('student_count', { ascending: false }).limit(10),
          supabase.from('v_group_performance' as 'events').select('*').eq('event_id' as 'id', eventId),
        ])
        setPrereg(preregRes.data as unknown as PreregFunnel | null)
        setEduBreakdown((eduRes.data ?? []) as unknown as EduBreakdown[])
        setFields((fieldRes.data ?? []) as unknown as FieldInterest[])
        setGroupPerf((groupRes.data ?? []) as unknown as GroupPerf[])
      }

      if (currentTab === 'pendant') {
        const [standRes, hourlyRes, funnelRes, dwellRes] = await Promise.all([
          supabase.from('v_stand_performance' as 'events').select('*').eq('event_id', eventId).order('scan_count', { ascending: false }).limit(15),
          supabase.from('v_hourly_scans' as 'events').select('*').eq('event_id', eventId).order('scan_hour', { ascending: true }),
          supabase.from('v_engagement_funnel' as 'events').select('*').eq('event_id', eventId).maybeSingle(),
          supabase.from('v_dwell_distribution' as 'events').select('*').eq('event_id', eventId),
        ])
        setStands((standRes.data ?? []) as unknown as StandPerf[])
        setHourly((hourlyRes.data ?? []) as unknown as HourlyScan[])
        setFunnel(funnelRes.data as unknown as FunnelRow | null)
        setDwell((dwellRes.data ?? []) as unknown as DwellBucket[])
      }

      if (currentTab === 'apres') {
        const [leadRes, standRes, apptRes] = await Promise.all([
          supabase.from('v_lead_quality_by_school' as 'events').select('*').eq('event_id', eventId).order('total_leads', { ascending: false }).limit(15),
          supabase.from('v_stand_performance' as 'events').select('*').eq('event_id', eventId).order('scan_count', { ascending: false }),
          supabase.from('appointments').select('status').eq('event_id', eventId),
        ])
        setLeadQuality((leadRes.data ?? []) as unknown as LeadQuality[])
        setStands((standRes.data ?? []) as unknown as StandPerf[])
        // Aggregate appointments by status
        const apptMap: Record<string, number> = {}
        ;(apptRes.data ?? []).forEach((a: { status: string }) => { apptMap[a.status] = (apptMap[a.status] ?? 0) + 1 })
        setApptAgg(Object.entries(apptMap).map(([status, count]) => ({ status, count })))
      }

      if (currentTab === 'clusters') {
        // Build cluster data from users + scans
        const { data: students } = await supabase
          .from('users')
          .select('id, intent_level, intent_score, last_dwell_minutes, education_branches, is_booth_registered, is_minor, parent_approved, parent_email, postal_code')
          .eq('role', 'student')

        const { data: entryScans } = await supabase
          .from('scans')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('channel', 'entry')

        const { data: standScans } = await supabase
          .from('scans')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('channel', 'stand')

        const { data: appointments } = await supabase
          .from('appointments')
          .select('student_id, status')
          .eq('event_id', eventId)

        const entryUserIds = new Set((entryScans ?? []).map(s => s.user_id))
        const attendees = (students ?? []).filter(s => entryUserIds.has(s.id))

        // Stand scan counts per user
        const standCountMap: Record<string, number> = {}
        ;(standScans ?? []).forEach(s => { standCountMap[s.user_id] = (standCountMap[s.user_id] ?? 0) + 1 })

        // Appointment set
        const apptSet = new Set((appointments ?? []).filter(a => a.status !== 'cancelled').map(a => a.student_id))

        // Build clusters
        const clusterMap: Record<string, { users: typeof attendees; standCounts: number[]; dwells: number[]; rdvCount: number; branchMap: Record<string, number> }> = {
          high: { users: [], standCounts: [], dwells: [], rdvCount: 0, branchMap: {} },
          medium: { users: [], standCounts: [], dwells: [], rdvCount: 0, branchMap: {} },
          low: { users: [], standCounts: [], dwells: [], rdvCount: 0, branchMap: {} },
        }

        attendees.forEach(u => {
          const level = u.intent_level ?? 'low'
          const c = clusterMap[level]
          if (!c) return
          c.users.push(u)
          c.standCounts.push(standCountMap[u.id] ?? 0)
          c.dwells.push(u.last_dwell_minutes ?? 0)
          if (apptSet.has(u.id)) c.rdvCount++
          ;(u.education_branches ?? []).forEach((b: string) => { c.branchMap[b] = (c.branchMap[b] ?? 0) + 1 })
        })

        const totalAttendees = attendees.length || 1
        const clusterResult: ClusterData[] = ['high', 'medium', 'low'].map(level => {
          const c = clusterMap[level]
          const n = c.users.length || 1
          const topBranches = Object.entries(c.branchMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, pct: Math.round(count / n * 100) }))
          return {
            level,
            count: c.users.length,
            avgScore: Math.round(c.users.reduce((s, u) => s + (u.intent_score ?? 0), 0) / n),
            avgDwell: Math.round(c.dwells.reduce((s, d) => s + d, 0) / n),
            avgStands: Math.round(c.standCounts.reduce((s, d) => s + d, 0) / n * 10) / 10,
            rdvPct: Math.round(c.rdvCount / n * 100),
            topBranches,
          }
        })
        setClusters(clusterResult)

        // Geographic distribution
        const deptMap: Record<string, number> = {}
        attendees.forEach(u => {
          if (u.postal_code && u.postal_code.length >= 2) {
            const dept = u.postal_code.substring(0, 2)
            deptMap[dept] = (deptMap[dept] ?? 0) + 1
          }
        })
        setGeoData(Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([dept, count]) => ({ dept, count })))

        // Booth vs App
        const boothUsers = attendees.filter(u => u.is_booth_registered)
        const appUsers = attendees.filter(u => !u.is_booth_registered)
        const buildStat = (list: typeof attendees) => {
          const n = list.length || 1
          return {
            count: list.length,
            avgScore: Math.round(list.reduce((s, u) => s + (u.intent_score ?? 0), 0) / n),
            avgDwell: Math.round(list.reduce((s, u) => s + (u.last_dwell_minutes ?? 0), 0) / n),
            decidingPct: Math.round(list.filter(u => u.intent_level === 'high').length / n * 100),
          }
        }
        setBoothVsApp({ booth: buildStat(boothUsers), app: buildStat(appUsers) })

        // Minors
        const minors = attendees.filter(u => u.is_minor)
        setMinorStats({
          total: minors.length,
          approved: minors.filter(u => u.parent_approved).length,
          withParent: minors.filter(u => u.parent_email).length,
        })
      }

      setLastRefresh(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des données')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Trigger load on event or tab change
  useEffect(() => {
    if (selectedEvent) loadTabData(selectedEvent.id, tab)
  }, [selectedEvent, tab, loadTabData])

  // Auto-refresh for PENDANT tab
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (tab === 'pendant' && selectedEvent) {
      intervalRef.current = setInterval(() => {
        loadTabData(selectedEvent.id, 'pendant', true)
      }, 30_000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tab, selectedEvent, loadTabData])

  // Time since last refresh
  const [timeSince, setTimeSince] = useState('0s')
  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.round((Date.now() - lastRefresh.getTime()) / 1000)
      setTimeSince(diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}min`)
    }, 1000)
    return () => clearInterval(id)
  }, [lastRefresh])

  // ─── Computed values from KPIs ───
  const noShowCount = (kpis?.app_registered ?? 0) - (kpis?.entered ?? 0)
  const noShowPct = pctNum(Math.max(0, noShowCount), kpis?.app_registered ?? 0)

  // ─── Alerts for PENDANT ───
  const alerts: { type: 'warning' | 'critical' | 'info'; text: string }[] = []
  if (kpis && noShowPct > 10) {
    alerts.push({
      type: noShowPct > 25 ? 'critical' : 'warning',
      text: `${fmt(Math.max(0, noShowCount))} no-shows (${noShowPct.toFixed(1).replace('.', ',')}% des inscrits)`,
    })
  }
  if (stands.length > 0) {
    const medianScans = [...stands].sort((a, b) => a.scan_count - b.scan_count)[Math.floor(stands.length / 2)]?.scan_count ?? 0
    stands.filter(s => medianScans > 0 && s.scan_count > medianScans * 3).forEach(s => {
      alerts.push({ type: 'info', text: `Stand ${s.school_name} a 3x le trafic médian (${fmt(s.scan_count)} scans)` })
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

        {/* Stripe rule */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.red} 60%, ${C.blue} 60% 80%, ${C.yellow} 80%)` }} />

        <div style={{ padding: '28px 32px' }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: C.gray900 }}>Tableau de bord</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.gray500 }}>
                Pilotage temps réel &middot; L&apos;Étudiant Salons
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Refresh indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.gray500 }}>
                {refreshing && (
                  <span style={{ width: 14, height: 14, border: `2px solid ${C.red}`, borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                )}
                <span>Mis à jour il y a {timeSince}</span>
              </div>
              {/* Event selector */}
              {events.length > 0 && (
                <select value={selectedEvent?.id ?? ''} onChange={e => {
                  const ev = events.find(x => x.id === e.target.value)
                  if (ev) setSelectedEvent(ev)
                }} style={{
                  border: `1px solid ${C.gray200}`, borderRadius: 8, padding: '8px 14px',
                  fontSize: 14, background: '#fff', color: C.gray900, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
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

          {/* ERROR */}
          {error && (
            <div style={{ background: C.red, color: '#fff', borderRadius: 8, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
              <span>Erreur de chargement des données : {error}</span>
              <button onClick={() => selectedEvent && loadTabData(selectedEvent.id, tab)} style={{
                background: '#fff', color: C.red, border: 'none', borderRadius: 6, padding: '6px 14px',
                fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}>Réessayer</button>
            </div>
          )}

          {/* NO EVENTS */}
          {!loading && events.length === 0 && (
            <div style={{ ...cardStyle, textAlign: 'center' as const, padding: 60 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: C.gray700, margin: '0 0 8px' }}>Aucun événement configuré</p>
              <p style={{ fontSize: 14, color: C.gray500, margin: 0 }}>Créez un salon dans la base de données pour commencer.</p>
            </div>
          )}

          {/* TAB BAR */}
          {events.length > 0 && (
            <div style={{
              display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 4,
              marginBottom: 28, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {([
                { key: 'avant' as Tab, label: 'Avant' },
                { key: 'pendant' as Tab, label: 'Pendant' },
                { key: 'apres' as Tab, label: 'Après' },
                { key: 'clusters' as Tab, label: 'Clusters' },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  background: tab === t.key ? C.red : 'transparent',
                  color: tab === t.key ? '#fff' : C.gray500,
                  border: 'none', borderRadius: 9, padding: '10px 22px',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", position: 'relative' as const,
                  transition: 'all 0.15s',
                }}>
                  {t.label}
                  {t.key === 'pendant' && tab === 'pendant' && (
                    <span style={{
                      position: 'absolute' as const, top: 8, right: 8, width: 6, height: 6,
                      borderRadius: '50%', background: '#fff',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* LOADING */}
          {loading && <LoadingSkeleton />}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: AVANT */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {!loading && tab === 'avant' && kpis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* KPI Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                <KPICard label="Pré-inscrits EventMaker" value={prereg?.total_preregistered ?? 0} color={C.gray700} />
                <KPICard label="Inscrits App" value={kpis.app_registered}
                  sub={prereg ? `Résolution : ${prereg.resolution_rate_pct ?? 0}%` : undefined} color={C.red} />
                <KPICard label="Groupes enseignants" value={kpis.teacher_groups} color={C.blue} />
                <KPICard label="Élèves en groupe" value={kpis.group_members_total}
                  sub={kpis.app_registered > 0 ? `${pct(kpis.group_members_total, kpis.app_registered)}% du total` : undefined}
                  color={C.blue} />
              </div>

              {/* Pre-registration funnel */}
              {prereg && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Entonnoir pré-inscription</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: 'Pré-inscrits', value: prereg.total_preregistered, fill: C.gray500 },
                      { name: 'Résolus (liés app)', value: prereg.resolved, fill: C.blue },
                      { name: 'Entrés au salon', value: prereg.resolved_and_entered, fill: C.success },
                    ]} layout="vertical" margin={{ left: 140, right: 40, top: 10, bottom: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 12, fill: C.gray500 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: C.gray700 }} width={130} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'Étudiants']} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {[C.gray500, C.blue, C.success].map((c, i) => <Cell key={i} fill={c} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: C.gray500 }}>
                    <span>Pré-inscrits → Résolus : <strong style={{ color: C.blue }}>{prereg.total_preregistered > 0 ? pct(prereg.resolved, prereg.total_preregistered) : '0'}%</strong></span>
                    <span>Résolus → Entrés : <strong style={{ color: C.success }}>{prereg.resolved > 0 ? pct(prereg.resolved_and_entered, prereg.resolved) : '0'}%</strong></span>
                  </div>
                </div>
              )}

              {/* Two columns: Education + Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Education level */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Niveau d&apos;études</h2>
                  {eduBreakdown.length === 0 ? <EmptyState text="Aucune donnée disponible" /> : (
                    <ResponsiveContainer width="100%" height={Math.max(200, eduBreakdown.reduce<Record<string, number>>((acc, e) => {
                      acc[e.education_level ?? 'Non renseigné'] = (acc[e.education_level ?? 'Non renseigné'] ?? 0) + e.student_count; return acc
                    }, {} as Record<string, number>) && Object.keys(eduBreakdown.reduce<Record<string, number>>((acc, e) => {
                      acc[e.education_level ?? 'Non renseigné'] = (acc[e.education_level ?? 'Non renseigné'] ?? 0) + e.student_count; return acc
                    }, {})).length * 36)}>
                      <BarChart
                        data={Object.entries(eduBreakdown.reduce<Record<string, number>>((acc, e) => {
                          const key = e.education_level ?? 'Non renseigné'
                          acc[key] = (acc[key] ?? 0) + e.student_count; return acc
                        }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)}
                        layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 11, fill: C.gray500 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.gray700 }} width={90} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'Étudiants']} />
                        <Bar dataKey="count" fill={C.blue} radius={[0, 6, 6, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Top fields */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Top 10 filières demandées</h2>
                  {fields.length === 0 ? <EmptyState text="Aucune donnée disponible" /> : (
                    <ResponsiveContainer width="100%" height={Math.max(200, fields.length * 36)}>
                      <BarChart data={fields} layout="vertical" margin={{ left: 120, right: 50, top: 5, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 11, fill: C.gray500 }} />
                        <YAxis type="category" dataKey="branch" tick={{ fontSize: 12, fill: C.gray700 }} width={110} />
                        <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === 'pct_of_attendees' ? `${v}%` : fmt(v), name === 'pct_of_attendees' ? '% participants' : 'Étudiants']} />
                        <Bar dataKey="student_count" fill={C.red} radius={[0, 6, 6, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Teacher groups table */}
              {groupPerf.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Groupes enseignants</h2>
                  <SortableTable
                    columns={[
                      { key: 'group_name', label: 'Groupe' },
                      { key: 'school_name', label: 'Établissement' },
                      { key: 'member_count', label: 'Membres', numeric: true },
                      { key: 'members_entered', label: 'Entrés', numeric: true },
                      { key: 'members_scanned_stand', label: 'Stands visités', numeric: true },
                    ]}
                    rows={groupPerf.map(g => ({
                      group_name: g.group_name ?? 'Groupe',
                      school_name: g.school_name ?? '—',
                      member_count: g.member_count ?? 0,
                      members_entered: g.members_entered ?? 0,
                      members_scanned_stand: g.members_scanned_stand ?? 0,
                    }))}
                    defaultSortCol="member_count"
                  />
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: PENDANT */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {!loading && tab === 'pendant' && kpis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* KPI Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                <KPICard label="Présents" value={kpis.entered} color={C.success} pulse />
                <KPICard label="No-shows" value={Math.max(0, noShowCount)}
                  sub={`${noShowPct.toFixed(1).replace('.', ',')}% des inscrits`}
                  color={noShowPct > 25 ? C.red : C.warning}
                  bgOverride={noShowPct > 25 ? C.redLight : noShowPct > 10 ? C.yellowLight : '#fff'} />
                <KPICard label="Scans stands" value={kpis.total_stand_scans} color={C.blue} />
                <KPICard label="RDV confirmés" value={kpis.confirmed_appointments} color={C.success} />
                <KPICard label="Leads live" value={kpis.deciding_count + kpis.comparing_count + kpis.exploring_count} color={C.red} />
              </div>

              {/* Hourly heatmap */}
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Fréquentation horaire</h2>
                {hourly.length === 0 ? <EmptyState text="Aucun scan enregistré pour cet événement" /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={(() => {
                      const hourMap: Record<string, { hour: string; entry: number; stand: number; conference: number }> = {}
                      hourly.forEach(h => {
                        const hour = new Date(h.scan_hour).getHours() + 'h'
                        if (!hourMap[hour]) hourMap[hour] = { hour, entry: 0, stand: 0, conference: 0 }
                        const channel = h.channel as 'entry' | 'stand' | 'conference'
                        if (channel in hourMap[hour]) hourMap[hour][channel] += h.scan_count
                      })
                      return Object.values(hourMap).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
                    })()} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: C.gray500 }} />
                      <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                      <Tooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="entry" name="Entrées" stackId="1" stroke={C.red} fill={C.red} fillOpacity={0.4} />
                      <Area type="monotone" dataKey="stand" name="Stands" stackId="1" stroke={C.blue} fill={C.blue} fillOpacity={0.4} />
                      <Area type="monotone" dataKey="conference" name="Conférences" stackId="1" stroke={C.yellow} fill={C.yellow} fillOpacity={0.4} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <ReferenceLine x={new Date().getHours() + 'h'} stroke={C.red} strokeDasharray="4 4" label={{ value: 'Maintenant', fill: C.red, fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Two columns: Stands + Funnel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Top stands */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Top 15 stands</h2>
                  {stands.length === 0 ? <EmptyState text="Aucun stand scanné" /> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stands.map((s, i) => {
                        const maxScans = stands[0]?.scan_count || 1
                        const badges = ['#FFD700', '#C0C0C0', '#CD7F32']
                        return (
                          <div key={s.stand_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                              background: i < 3 ? badges[i] : C.gray100, color: i < 3 ? '#fff' : C.gray500,
                            }}>{i + 1}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: C.gray900 }}>{s.school_name}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{fmt(s.scan_count)}</span>
                              </div>
                              <div style={{ height: 5, background: C.gray100, borderRadius: 3 }}>
                                <div style={{
                                  width: `${(s.scan_count / maxScans) * 100}%`, height: '100%', borderRadius: 3,
                                  background: `linear-gradient(90deg, ${C.red}, ${C.blue})`,
                                }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Engagement funnel */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Entonnoir d&apos;engagement</h2>
                  {!funnel ? <EmptyState text="Aucune donnée d'engagement" /> : (() => {
                    const steps = [
                      { label: 'Inscrits', value: funnel.registered, color: C.gray500 },
                      { label: 'Entrés', value: funnel.entered, color: C.blue },
                      { label: 'Stand scanné', value: funnel.scanned_stand, color: C.yellow },
                      { label: 'Swipe droit', value: funnel.swiped_right, color: C.red },
                      { label: 'RDV pris', value: funnel.booked_rdv, color: C.success },
                    ]
                    const maxVal = steps[0]?.value || 1
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {steps.map((s, i) => (
                          <div key={s.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                              <span style={{ fontWeight: 600, color: C.gray700 }}>{s.label}</span>
                              <span style={{ fontWeight: 700, color: s.color }}>{fmt(s.value)}</span>
                            </div>
                            <div style={{ height: 28, background: C.gray100, borderRadius: 6, position: 'relative' as const }}>
                              <div style={{
                                height: '100%', width: `${Math.max(2, (s.value / maxVal) * 100)}%`,
                                background: s.color, borderRadius: 6, opacity: 0.8,
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                              }}>
                                {maxVal > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{pct(s.value, maxVal)}%</span>}
                              </div>
                            </div>
                            {i > 0 && i < steps.length && steps[i - 1].value > 0 && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.gray500, textAlign: 'right' as const }}>
                                Abandon : {pct(steps[i - 1].value - s.value, steps[i - 1].value)}%
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Dwell distribution */}
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Distribution du temps passé</h2>
                {dwell.length === 0 ? <EmptyState text="Aucune donnée de durée" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={(() => {
                      const order = ['< 30 min', '30-60 min', '1-2h', '2-3h', '3h+']
                      return order.map(b => dwell.find(d => d.dwell_bucket === b) ?? { dwell_bucket: b, student_count: 0, avg_dwell: 0 })
                    })()} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                      <XAxis dataKey="dwell_bucket" tick={{ fontSize: 12, fill: C.gray500 }} />
                      <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                      <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [
                        name === 'avg_dwell' ? `${v} min` : fmt(v),
                        name === 'avg_dwell' ? 'Durée moy.' : 'Étudiants',
                      ]} />
                      <Bar dataKey="student_count" name="Étudiants" radius={[6, 6, 0, 0]} barSize={40}>
                        {(() => {
                          const order = ['< 30 min', '30-60 min', '1-2h', '2-3h', '3h+']
                          const data = order.map(b => dwell.find(d => d.dwell_bucket === b)?.student_count ?? 0)
                          const maxIdx = data.indexOf(Math.max(...data))
                          return data.map((_, i) => <Cell key={i} fill={i === maxIdx ? C.red : C.blue} />)
                        })()}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Alertes temps réel</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((a, i) => (
                      <div key={i} style={{
                        padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                        background: a.type === 'critical' ? C.redLight : a.type === 'warning' ? C.yellowLight : C.blueLight,
                        color: a.type === 'critical' ? C.redDark : a.type === 'warning' ? '#92400e' : C.blue,
                      }}>
                        {a.type === 'critical' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'} {a.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: APRÈS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {!loading && tab === 'apres' && kpis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* KPI Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <KPICard label="Total Leads" value={kpis.deciding_count + kpis.comparing_count + kpis.exploring_count} color={C.red} />
                <KPICard label="Décideurs (intent haut)" value={kpis.deciding_count}
                  sub={`${pct(kpis.deciding_count, kpis.deciding_count + kpis.comparing_count + kpis.exploring_count)}% du total`}
                  color={C.success} />
                <KPICard label="Taux de conversion" value={kpis.entered > 0 ? `${pct(kpis.deciding_count + kpis.comparing_count + kpis.exploring_count, kpis.entered)}%` : '—'}
                  sub="leads / entrés" color={C.blue} />
              </div>
              {/* KPI Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <KPICard label="RDV honorés" value={(() => {
                  const attended = apptAgg.find(a => a.status === 'attended')?.count ?? 0
                  const total = apptAgg.reduce((s, a) => s + a.count, 0)
                  return total > 0 ? `${fmt(attended)}/${fmt(total)} (${pct(attended, total)}%)` : '—'
                })()} color={C.success} />
                <KPICard label="Exports réalisés" value="—" sub="leads exportés par les exposants" color={C.gray700} />
                <KPICard label="Score moyen" value={leadQuality.length > 0 ? `${Math.round(leadQuality.reduce((s, l) => s + (l.avg_score ?? 0), 0) / leadQuality.length)}/100` : '—'} color={C.blue} />
              </div>

              {/* Lead quality by school */}
              {leadQuality.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Qualité des leads par école</h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={leadQuality.slice(0, 12)} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                      <XAxis dataKey="school_name" tick={{ fontSize: 11, fill: C.gray500, angle: -35, textAnchor: 'end' }} interval={0} height={80} />
                      <YAxis tick={{ fontSize: 12, fill: C.gray500 }} />
                      <Tooltip {...tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="deciding_leads" name="Décideurs" stackId="a" fill={TIER.deciding} barSize={32} />
                      <Bar dataKey="comparing_leads" name="Comparateurs" stackId="a" fill={TIER.comparing} />
                      <Bar dataKey="exploring_leads" name="Explorateurs" stackId="a" fill={TIER.exploring} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Two columns: Intent pie + Appointment pie */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Intent distribution */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Répartition par intention</h2>
                  {(() => {
                    const totalLeads = kpis.deciding_count + kpis.comparing_count + kpis.exploring_count
                    const data = [
                      { name: 'Décideurs', value: kpis.deciding_count, color: TIER.deciding },
                      { name: 'Comparateurs', value: kpis.comparing_count, color: TIER.comparing },
                      { name: 'Explorateurs', value: kpis.exploring_count, color: TIER.exploring },
                    ]
                    return totalLeads === 0 ? <EmptyState text="Aucun lead" /> : (
                      <div>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'Étudiants']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center' as const, marginTop: -30, marginBottom: 10 }}>
                          <p style={{ fontSize: 22, fontWeight: 700, color: C.gray900, margin: 0 }}>{fmt(totalLeads)}</p>
                          <p style={{ fontSize: 12, color: C.gray500, margin: 0 }}>étudiants</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                          {data.map(d => (
                            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                              <span style={{ color: C.gray700 }}>{d.name} : <strong>{fmt(d.value)}</strong> ({pct(d.value, totalLeads)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Appointment outcomes */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Résultats des rendez-vous</h2>
                  {apptAgg.length === 0 ? <EmptyState text="Aucun rendez-vous" /> : (() => {
                    const colorMap: Record<string, string> = { attended: C.success, confirmed: C.blue, pending: C.warning, cancelled: C.gray500 }
                    const labelMap: Record<string, string> = { attended: 'Honorés', confirmed: 'Confirmés', pending: 'En attente', cancelled: 'Annulés' }
                    const total = apptAgg.reduce((s, a) => s + a.count, 0)
                    return (
                      <div>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={apptAgg.map(a => ({ ...a, name: labelMap[a.status] ?? a.status }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count">
                              {apptAgg.map((a, i) => <Cell key={i} fill={colorMap[a.status] ?? C.gray500} />)}
                            </Pie>
                            <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'RDV']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' as const }}>
                          {apptAgg.map(a => (
                            <div key={a.status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap[a.status] ?? C.gray500 }} />
                              <span style={{ color: C.gray700 }}>{labelMap[a.status] ?? a.status} : <strong>{fmt(a.count)}</strong> ({pct(a.count, total)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Stand performance table */}
              {stands.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Performance des stands</h2>
                  <SortableTable
                    columns={[
                      { key: 'school_name', label: 'École' },
                      { key: 'scan_count', label: 'Scans', numeric: true },
                      { key: 'unique_visitors', label: 'Visiteurs uniques', numeric: true },
                      { key: 'morning_scans', label: 'Matin', numeric: true },
                      { key: 'lunch_scans', label: 'Midi', numeric: true },
                      { key: 'afternoon_scans', label: 'Après-midi', numeric: true },
                      { key: 'swipe_rights', label: 'Swipes →', numeric: true },
                      { key: 'appointments', label: 'RDV', numeric: true },
                    ]}
                    rows={stands.map(s => ({
                      school_name: s.school_name,
                      scan_count: s.scan_count,
                      unique_visitors: s.unique_visitors,
                      morning_scans: s.morning_scans,
                      lunch_scans: s.lunch_scans,
                      afternoon_scans: s.afternoon_scans,
                      swipe_rights: s.swipe_rights,
                      appointments: s.appointments,
                    }))}
                    defaultSortCol="scan_count"
                    highlightTop={3}
                  />
                </div>
              )}

              {/* Export buttons */}
              <div style={{ display: 'flex', gap: 14 }}>
                <button onClick={() => {
                  if (!kpis) return
                  const totalLeads = kpis.deciding_count + kpis.comparing_count + kpis.exploring_count
                  downloadCSV(`kpis_${kpis.event_name.replace(/\s/g, '_')}.csv`,
                    ['Métrique', 'Valeur'],
                    [
                      ['Inscrits App', String(kpis.app_registered)],
                      ['Entrés', String(kpis.entered)],
                      ['No-shows', String(Math.max(0, noShowCount))],
                      ['Scans stands', String(kpis.total_stand_scans)],
                      ['Total leads', String(totalLeads)],
                      ['Décideurs', String(kpis.deciding_count)],
                      ['Comparateurs', String(kpis.comparing_count)],
                      ['Explorateurs', String(kpis.exploring_count)],
                      ['Groupes', String(kpis.teacher_groups)],
                      ['RDV total', String(kpis.total_appointments)],
                      ['RDV confirmés', String(kpis.confirmed_appointments)],
                    ])
                }} style={{
                  background: C.red, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Exporter KPIs (CSV)
                </button>
                <button onClick={() => {
                  if (stands.length === 0) return
                  downloadCSV(`stands_${selectedEvent?.name.replace(/\s/g, '_') ?? 'export'}.csv`,
                    ['École', 'Scans', 'Visiteurs uniques', 'Matin', 'Midi', 'Après-midi', 'Swipes droits', 'RDV'],
                    stands.map(s => [
                      s.school_name, String(s.scan_count), String(s.unique_visitors),
                      String(s.morning_scans), String(s.lunch_scans), String(s.afternoon_scans),
                      String(s.swipe_rights), String(s.appointments),
                    ]))
                }} style={{
                  background: '#fff', color: C.red, border: `2px solid ${C.red}`, borderRadius: 8,
                  padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Exporter Stands (CSV)
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: CLUSTERS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {!loading && tab === 'clusters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 3 Segment cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {clusters.map(c => {
                  const tierKey = c.level === 'high' ? 'deciding' : c.level === 'medium' ? 'comparing' : 'exploring'
                  const totalC = clusters.reduce((s, x) => s + x.count, 0) || 1
                  return (
                    <div key={c.level} style={{
                      ...cardStyle,
                      borderLeft: `4px solid ${TIER[tierKey]}`,
                      background: TIER_LIGHT[tierKey],
                    }}>
                      <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: TIER[tierKey] }}>
                        {TIER_LABEL[tierKey]}
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: 28, fontWeight: 700, color: TIER[tierKey] }}>
                        {fmt(c.count)} <span style={{ fontSize: 14, fontWeight: 500, color: C.gray500 }}>({pct(c.count, totalC)}%)</span>
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13, color: C.gray700 }}>
                        <div>Score moy. <strong>{c.avgScore}</strong></div>
                        <div>Durée moy. <strong>{c.avgDwell > 60 ? `${Math.floor(c.avgDwell / 60)}h${String(c.avgDwell % 60).padStart(2, '0')}` : `${c.avgDwell}min`}</strong></div>
                        <div>Stands moy. <strong>{c.avgStands}</strong></div>
                        <div>RDV pris <strong>{c.rdvPct}%</strong></div>
                      </div>
                      {c.topBranches.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <p style={{ ...captionStyle, margin: '0 0 6px' }}>Top filières</p>
                          {c.topBranches.map(b => (
                            <p key={b.name} style={{ margin: '0 0 2px', fontSize: 12, color: C.gray700 }}>
                              {b.name} ({b.pct}%)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Radar chart */}
              {clusters.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Comparaison des segments</h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={(() => {
                      const maxStands = Math.max(...clusters.map(c => c.avgStands), 1)
                      const maxDwell = Math.max(...clusters.map(c => c.avgDwell), 1)
                      return [
                        { metric: 'Stands visités', ...Object.fromEntries(clusters.map(c => [c.level, Math.round(c.avgStands / maxStands * 100)])) },
                        { metric: 'RDV pris', ...Object.fromEntries(clusters.map(c => [c.level, c.rdvPct])) },
                        { metric: 'Score', ...Object.fromEntries(clusters.map(c => [c.level, Math.round(c.avgScore / 150 * 100)])) },
                        { metric: 'Durée visite', ...Object.fromEntries(clusters.map(c => [c.level, Math.round(c.avgDwell / maxDwell * 100)])) },
                        { metric: 'Top filières', ...Object.fromEntries(clusters.map(c => [c.level, c.topBranches[0]?.pct ?? 0])) },
                      ]
                    })()}>
                      <PolarGrid stroke={C.gray200} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: C.gray700 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10, fill: C.gray500 }} domain={[0, 100]} />
                      <Radar name="Décideurs" dataKey="high" stroke={TIER.deciding} fill={TIER.deciding} fillOpacity={0.15} strokeWidth={2} />
                      <Radar name="Comparateurs" dataKey="medium" stroke={TIER.comparing} fill={TIER.comparing} fillOpacity={0.15} strokeWidth={2} />
                      <Radar name="Explorateurs" dataKey="low" stroke={TIER.exploring} fill={TIER.exploring} fillOpacity={0.15} strokeWidth={2} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip {...tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Education × Intent bubble chart */}
              {eduBreakdown.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Niveau d&apos;études × Intention</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.gray200} />
                      <XAxis dataKey="x" name="Niveau" tick={{ fontSize: 11, fill: C.gray500 }} label={{ value: 'Niveau d\'études', position: 'bottom', fontSize: 12, fill: C.gray500 }} />
                      <YAxis dataKey="y" name="Intention" tick={{ fontSize: 11, fill: C.gray500 }} label={{ value: 'Intention', angle: -90, position: 'insideLeft', fontSize: 12, fill: C.gray500 }} />
                      <ZAxis dataKey="z" range={[40, 400]} name="Étudiants" />
                      <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === 'Étudiants' ? fmt(v) : v, name]} />
                      <Scatter data={eduBreakdown.map(e => {
                        const levels = ['seconde', 'première', 'terminale', 'bac+1', 'bac+2', 'bac+3', 'bac+4', 'bac+5']
                        const intents = ['low', 'medium', 'high']
                        return {
                          x: levels.indexOf((e.education_level ?? '').toLowerCase()) + 1 || 1,
                          y: intents.indexOf(e.intent_level) + 1,
                          z: e.student_count,
                          fill: TIER[e.intent_level === 'high' ? 'deciding' : e.intent_level === 'medium' ? 'comparing' : 'exploring'],
                        }
                      })}>
                        {eduBreakdown.map((e, i) => (
                          <Cell key={i} fill={TIER[e.intent_level === 'high' ? 'deciding' : e.intent_level === 'medium' ? 'comparing' : 'exploring']} fillOpacity={0.7} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Geographic distribution */}
              {geoData.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Distribution géographique (top 10 départements)</h2>
                  <ResponsiveContainer width="100%" height={Math.max(200, geoData.length * 36)}>
                    <BarChart data={geoData} layout="vertical" margin={{ left: 50, right: 30, top: 5, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: C.gray500 }} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 13, fill: C.gray700 }} width={40} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), 'Étudiants']} />
                      <Bar dataKey="count" fill={C.blue} radius={[0, 6, 6, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Booth vs App */}
              {boothVsApp && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Kiosque vs Application</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {[
                      { label: 'Inscrits App', data: boothVsApp.app, color: C.red },
                      { label: 'Kiosque (booth)', data: boothVsApp.booth, color: C.blue },
                    ].map(side => (
                      <div key={side.label} style={{
                        background: C.gray100, borderRadius: 12, padding: '18px 20px',
                        borderTop: `3px solid ${side.color}`,
                      }}>
                        <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: side.color }}>{side.label}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 13, color: C.gray700 }}>
                          <div>Visiteurs <strong style={{ display: 'block', fontSize: 20, color: side.color }}>{fmt(side.data.count)}</strong></div>
                          <div>Score moy. <strong style={{ display: 'block', fontSize: 20, color: side.color }}>{side.data.avgScore}</strong></div>
                          <div>Durée moy. <strong style={{ display: 'block', fontSize: 20, color: side.color }}>{side.data.avgDwell} min</strong></div>
                          <div>Décideurs <strong style={{ display: 'block', fontSize: 20, color: side.color }}>{side.data.decidingPct}%</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {boothVsApp.app.decidingPct > boothVsApp.booth.decidingPct ? (
                    <p style={{ margin: '14px 0 0', fontSize: 13, color: C.success, fontWeight: 600 }}>
                      L&apos;application génère des leads de meilleure qualité (+{boothVsApp.app.decidingPct - boothVsApp.booth.decidingPct}pts de décideurs)
                    </p>
                  ) : boothVsApp.booth.decidingPct > boothVsApp.app.decidingPct ? (
                    <p style={{ margin: '14px 0 0', fontSize: 13, color: C.blue, fontWeight: 600 }}>
                      Le kiosque génère plus de décideurs (+{boothVsApp.booth.decidingPct - boothVsApp.app.decidingPct}pts)
                    </p>
                  ) : null}
                </div>
              )}

              {/* GDPR — Minors */}
              {minorStats && minorStats.total > 0 && (
                <div style={{
                  ...cardStyle, borderLeft: `4px solid ${C.warning}`, background: C.yellowLight,
                }}>
                  <h2 style={{ ...sectionTitle, color: '#92400e' }}>Conformité RGPD — Mineurs</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <p style={{ ...captionStyle, margin: '0 0 4px' }}>Étudiants mineurs</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#92400e' }}>{fmt(minorStats.total)}</p>
                    </div>
                    <div>
                      <p style={{ ...captionStyle, margin: '0 0 4px' }}>Consentement parental</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: minorStats.approved === minorStats.total ? C.success : C.warning }}>
                        {pct(minorStats.approved, minorStats.total)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ ...captionStyle, margin: '0 0 4px' }}>Email parent renseigné</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: minorStats.withParent === minorStats.total ? C.success : C.warning }}>
                        {pct(minorStats.withParent, minorStats.total)}%
                      </p>
                    </div>
                  </div>
                  {minorStats.approved < minorStats.total && (
                    <p style={{ margin: '12px 0 0', fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                      {fmt(minorStats.total - minorStats.approved)} mineur(s) sans consentement parental validé
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
    </div>
  )
}
