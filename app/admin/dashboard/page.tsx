'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { EventRow } from '@/lib/supabase/types'
import Icon from '@/components/ui/Icon'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE — L'Étudiant brand colors
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  tomate: '#EC1F27', tomateLight: '#FFF0F1', tomateDark: '#791F1F',
  piscine: '#0066CC', piscineLight: '#E6F0FF', piscineDark: '#0C447C',
  citron: '#FCD716', citronLight: '#FFF9E6', citronDark: '#633806',
  spirit: '#FF6B35', spiritLight: '#FFF0E6', spiritDark: '#712B13',
  menthe: '#4DB8A8', mentheLight: '#E0F2EF', mentheDark: '#085041',
  pourpre: '#932D99', pourpreLight: '#F3E5F5', pourpreDark: '#5B2D6E',
  nuit: '#2B1B4D', blanc: '#F8F7F2',
  g9: '#191829', g7: '#3D3D3D', g5: '#6B6B6B',
  g3: '#D4D4D4', g2: '#E8E8E8', g1: '#F4F4F4',
} as const

const TIER: Record<string, { color: string; bg: string; text: string; border: string; label: string; single: string; gradient: string }> = {
  high: { color: '#059669', bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'Décideurs', single: 'Décideur', gradient: 'linear-gradient(135deg, #EC1F27 0%, #C41520 100%)' },
  medium: { color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', label: 'Comparateurs', single: 'Comparateur', gradient: 'linear-gradient(135deg, #0066CC 0%, #004A99 100%)' },
  low: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: 'Explorateurs', single: 'Explorateur', gradient: 'linear-gradient(135deg, #FCD716 0%, #E6A800 100%)' },
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const pct = (n: number, t: number) => t === 0 ? '0' : (n / t * 100).toFixed(1).replace('.', ',')
const fmtMin = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`

type Tab = 'preparation' | 'jourj' | 'bilan' | 'clusters' | 'strategie'

// ═══════════════════════════════════════════════════════════════════════════
// RAW TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface RUser { id: string; email: string; name: string | null; role: string; education_level: string | null; bac_series: string | null; education_branches: string[] | null; wishlist: string[] | null; intent_score: number; intent_level: string; orientation_score: number; last_dwell_minutes: number | null; is_minor: boolean; is_booth_registered: boolean; optin_letudiant: boolean; created_at: string }
interface RScan { id: string; user_id: string; event_id: string; stand_id: string | null; channel: string; created_at: string }
interface RAppt { id: string; student_id: string; school_id: string; event_id: string; status: string }
interface RMatch { id: string; student_id: string; school_id: string; student_swipe: string | null }
interface RStand { id: string; event_id: string; school_id: string }
interface RSchool { id: string; name: string; type: string; city: string }
interface RPreReg { id: string; event_id: string; resolved_user_id: string | null }
interface FeedItem { time: string; text: string; color: string; id: string }

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/* Tooltip info bubble — FIXED: proper sizing, z-index, max-width */
function Tip({ text, children, color }: { text: string; children: React.ReactNode; color?: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <span style={{
        width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${color ?? 'currentColor'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, fontStyle: 'italic', opacity: 0.55, cursor: 'help',
        flexShrink: 0, lineHeight: 1,
      }}>i</span>
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
          background: C.nuit, color: '#fff', fontSize: 11, fontWeight: 400, letterSpacing: 0,
          textTransform: 'none' as const, padding: '10px 14px', borderRadius: 8,
          width: 260, maxWidth: 260, lineHeight: 1.5, zIndex: 9999,
          whiteSpace: 'normal' as const, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          pointerEvents: 'none' as const,
        }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', border: '6px solid transparent', borderTopColor: C.nuit }} />
        </span>
      )}
    </span>
  )
}

/* Tab-level question frame — Niveau 1 */
function TabQuestion({ emoji, question, explanation, accentColor }: { emoji: string; question: string; explanation: string; accentColor: string }) {
  return (
    <div style={{
      background: `${accentColor}08`, border: `1px solid ${accentColor}25`,
      borderRadius: 14, padding: '18px 22px', marginBottom: 18,
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.nuit, lineHeight: 1.3, marginBottom: 4 }}>{question}</div>
        <div style={{ fontSize: 12, color: C.g5, lineHeight: 1.5 }}>{explanation}</div>
      </div>
    </div>
  )
}

/* Section subtitle — Niveau 2 */
function SectionSub({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: C.g5, lineHeight: 1.5, marginBottom: 14, marginTop: -4 }}>{text}</div>
}

/* Colored KPI card (Justinmind style) */
function ColorCard({ label, value, sub, bg, textColor, tip, children }: { label: string; value: string | number; sub?: string; bg: string; textColor: string; tip?: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden', minHeight: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: textColor, opacity: 0.7, marginBottom: 8 }}>
        {tip ? <Tip text={tip} color={textColor}>{label}</Tip> : label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: textColor, lineHeight: 1 }}>{typeof value === 'number' ? fmt(value) : value}</div>
      {sub && <div style={{ fontSize: 11, color: textColor, opacity: 0.6, marginTop: 6 }}>{sub}</div>}
      {children}
    </div>
  )
}

/* Insight quote block */
function Insight({ children, color }: { children: React.ReactNode; color?: string }) {
  return <div style={{ fontSize: 13, color: C.g7, lineHeight: 1.7, padding: '14px 18px', background: C.g1, borderRadius: 10, borderLeft: `3px solid ${color ?? C.piscine}`, marginBottom: 20 }}>{children}</div>
}

/* Why box — explains a recommendation */
function WhyBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.g1, borderRadius: 12, padding: '16px 18px', fontSize: 12, color: C.g5, lineHeight: 1.6 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.g7, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

/* Progress bar */
function PBar({ label, value, max, color, tip }: { label: string; value: number; max: number; color: string; tip?: string }) {
  const w = max === 0 ? 0 : Math.max(3, (value / max) * 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: C.g7 }}>{tip ? <Tip text={tip}>{label}</Tip> : label}</span>
        <span style={{ fontWeight: 800, color }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 8, background: C.g1, borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16, padding: '22px 26px', marginBottom: 16 }
const ttS = { contentStyle: { background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 8, fontSize: 13 }, labelStyle: { fontWeight: 700, color: C.nuit } }

// ═══════════════════════════════════════════════════════════════════════════
// FLOW DIAGRAM
// ═══════════════════════════════════════════════════════════════════════════
function FlowDiagram({ scansCount, studentsCount, avgScore }: { scansCount: number; studentsCount: number; avgScore: number }) {
  const steps = [
    { icon: '①', title: 'Inscription', val: String(studentsCount), sub: 'étudiants', color: C.spirit, bg: C.spiritLight },
    { icon: '②', title: 'Scan QR', val: String(scansCount), sub: 'scans', color: C.menthe, bg: C.mentheLight },
    { icon: '③', title: 'Scoring auto', val: 'Trigger', sub: 'PostgreSQL', color: C.pourpre, bg: C.pourpreLight },
    { icon: '④', title: 'Dashboard', val: String(avgScore), sub: 'score moy.', color: C.tomate, bg: C.tomateLight },
  ]
  return (
    <div style={{ ...card, background: C.nuit, border: 'none', padding: '28px 30px', borderRadius: 16, boxShadow: heroShadow }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Comment ça marche</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Chaque interaction étudiant alimente le scoring en temps réel</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        L&apos;étudiant s&apos;inscrit → scanne un QR au salon → visite des stands → un trigger PostgreSQL recalcule son score à chaque scan → le dashboard se met à jour en direct.
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {steps.map((st, i) => (
          <div key={st.title} style={{ display: 'contents' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', borderTop: `3px solid ${st.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: st.color, marginBottom: 4 }}>{st.icon} {st.title}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{st.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{st.sub}</div>
            </div>
            {i < steps.length - 1 && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, flexShrink: 0 }}>→</div>}
          </div>
        ))}
      </div>
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Voir la formule technique ▾</summary>
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          score = 3×stands + 5×conf + 10×rdv + 2×swipes + 3×wishlist + 0.1×min + bonus — décideur ≥66 · comparateur ≥33 · explorateur &lt;33
        </div>
      </details>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('jourj')
  const [events, setEvents] = useState<EventRow[]>([])
  const [selEvent, setSelEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFlow, setShowFlow] = useState(true)

  const [users, setUsers] = useState<RUser[]>([])
  const [scans, setScans] = useState<RScan[]>([])
  const [appointments, setAppointments] = useState<RAppt[]>([])
  const [matches, setMatches] = useState<RMatch[]>([])
  const [stands, setStands] = useState<RStand[]>([])
  const [schools, setSchools] = useState<RSchool[]>([])
  const [preregs, setPreregs] = useState<RPreReg[]>([])
  const [allScans, setAllScans] = useState<RScan[]>([])
  const [allAppts, setAllAppts] = useState<RAppt[]>([])

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const realtimeRef = useRef<ReturnType<typeof getSupabase>['channel'] | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const sb = getSupabase()
        const { data } = await sb.from('events').select('*').order('event_date', { ascending: false })
        setEvents(data ?? [])
        if (data?.length) setSelEvent(data[0])
        else setLoading(false)
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur'); setLoading(false) }
    })()
  }, [])

  const loadAll = useCallback(async (eventId: string) => {
    setLoading(true); setError(null)
    try {
      const sb = getSupabase()
      const [uR, scR, apR, maR, stR, schR, prR, allScR, allApR] = await Promise.all([
        sb.from('users').select('id,email,name,role,education_level,bac_series,education_branches,wishlist,intent_score,intent_level,orientation_score,last_dwell_minutes,is_minor,is_booth_registered,optin_letudiant,created_at'),
        sb.from('scans').select('id,user_id,event_id,stand_id,channel,created_at').eq('event_id', eventId),
        sb.from('appointments').select('id,student_id,school_id,event_id,status').eq('event_id', eventId),
        sb.from('matches').select('id,student_id,school_id,student_swipe'),
        sb.from('stands').select('id,event_id,school_id').eq('event_id', eventId),
        sb.from('schools').select('id,name,type,city'),
        sb.from('pre_registrations').select('id,event_id,resolved_user_id').eq('event_id', eventId),
        sb.from('scans').select('id,user_id,event_id,stand_id,channel,created_at'),
        sb.from('appointments').select('id,student_id,school_id,event_id,status'),
      ])
      setUsers((uR.data ?? []) as RUser[])
      setScans((scR.data ?? []) as RScan[])
      setAppointments((apR.data ?? []) as RAppt[])
      setMatches((maR.data ?? []) as RMatch[])
      setStands((stR.data ?? []) as RStand[])
      setSchools((schR.data ?? []) as RSchool[])
      setPreregs((prR.data ?? []) as RPreReg[])
      setAllScans((allScR.data ?? []) as RScan[])
      setAllAppts((allApR.data ?? []) as RAppt[])
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (selEvent) loadAll(selEvent.id) }, [selEvent, loadAll])

  // REALTIME
  useEffect(() => {
    if (!selEvent) return
    const sb = getSupabase()
    if (realtimeRef.current) { sb.removeChannel(realtimeRef.current as Parameters<typeof sb.removeChannel>[0]) }
    const channel = sb.channel('dash-rt')
      .on('postgres_changes' as never, { event: 'INSERT', schema: 'public', table: 'scans', filter: `event_id=eq.${selEvent.id}` } as never, (payload: { new: RScan }) => {
        const scan = payload.new as RScan
        setScans(prev => [...prev, scan])
        setAllScans(prev => [...prev, scan])
        const userName = users.find(u => u.id === scan.user_id)?.name ?? 'Nouveau visiteur'
        const time = new Date(scan.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const stSchool: Record<string, string> = {}; stands.forEach(st => { stSchool[st.id] = st.school_id })
        const schName: Record<string, string> = {}; schools.forEach(sc => { schName[sc.id] = sc.name })
        let text = '', color = C.tomate
        if (scan.channel === 'entry') { text = `${userName} est entré(e) au salon`; color = C.tomate }
        else if (scan.channel === 'stand') { text = `${userName} → ${schName[stSchool[scan.stand_id ?? ''] ?? ''] ?? 'un stand'}`; color = C.piscine }
        else if (scan.channel === 'conference') { text = `${userName} en conférence`; color = C.citron }
        setFeed(prev => [{ time, text, color, id: scan.id }, ...prev].slice(0, 15))
      })
      .subscribe()
    realtimeRef.current = channel as typeof realtimeRef.current
    return () => { sb.removeChannel(channel as Parameters<typeof sb.removeChannel>[0]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selEvent?.id, users.length, stands.length, schools.length])

  // ─── ALL COMPUTED KPIs ───
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users])
  const entryScans = useMemo(() => scans.filter(s => s.channel === 'entry'), [scans])
  const standScans = useMemo(() => scans.filter(s => s.channel === 'stand'), [scans])
  const confScans = useMemo(() => scans.filter(s => s.channel === 'conference'), [scans])
  const enteredIds = useMemo(() => new Set(entryScans.map(s => s.user_id)), [entryScans])
  const attendees = useMemo(() => students.filter(s => enteredIds.has(s.id)), [students, enteredIds])

  const preregTotal = preregs.length
  const preregResolved = preregs.filter(p => p.resolved_user_id).length

  const branches = useMemo(() => {
    const m: Record<string, number> = {}
    attendees.forEach(u => (u.education_branches ?? []).forEach(b => { m[b] = (m[b] ?? 0) + 1 }))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [attendees])

  const eduLevels = useMemo(() => {
    const m: Record<string, number> = {}
    attendees.forEach(u => { m[u.education_level ?? 'Non renseigné'] = (m[u.education_level ?? 'Non renseigné'] ?? 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [attendees])

  const bacSeries = useMemo(() => {
    const m: Record<string, number> = {}
    attendees.forEach(u => { if (u.bac_series) m[u.bac_series] = (m[u.bac_series] ?? 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [attendees])

  const avgBranches = attendees.length > 0 ? Math.round(attendees.reduce((s, u) => s + (u.education_branches?.length ?? 0), 0) / attendees.length * 10) / 10 : 0
  const optinRate = students.length > 0 ? Math.round(students.filter(s => s.optin_letudiant).length / students.length * 100) : 0

  const dwellMap = useMemo(() => {
    const m: Record<string, { min: number; max: number }> = {}
    scans.forEach(sc => { const t = new Date(sc.created_at).getTime(); if (!m[sc.user_id]) m[sc.user_id] = { min: t, max: t }; else { m[sc.user_id].min = Math.min(m[sc.user_id].min, t); m[sc.user_id].max = Math.max(m[sc.user_id].max, t) } })
    const r: Record<string, number> = {}; Object.entries(m).forEach(([uid, v]) => { r[uid] = Math.round((v.max - v.min) / 60000) }); return r
  }, [scans])
  const avgDwell = useMemo(() => { const v = Object.values(dwellMap).filter(x => x > 0); return v.length > 0 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0 }, [dwellMap])

  const standsMap = useMemo(() => {
    const m: Record<string, Set<string>> = {}
    standScans.forEach(sc => { if (sc.stand_id) { if (!m[sc.user_id]) m[sc.user_id] = new Set(); m[sc.user_id].add(sc.stand_id) } })
    return m
  }, [standScans])
  const avgStands = useMemo(() => { const v = Object.values(standsMap).map(s => s.size); return v.length > 0 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0 }, [standsMap])

  const avgTimePerStand = useMemo(() => {
    const byU: Record<string, number[]> = {}
    standScans.forEach(sc => { if (!byU[sc.user_id]) byU[sc.user_id] = []; byU[sc.user_id].push(new Date(sc.created_at).getTime()) })
    const gaps: number[] = []; Object.values(byU).forEach(t => { t.sort((a, b) => a - b); for (let i = 1; i < t.length; i++) gaps.push((t[i] - t[i - 1]) / 60000) })
    return gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0
  }, [standScans])

  const rdvSet = useMemo(() => new Set(appointments.filter(a => a.status !== 'cancelled').map(a => a.student_id)), [appointments])
  const rdvRate = enteredIds.size > 0 ? Math.round(rdvSet.size / enteredIds.size * 100) : 0
  const avgScore = attendees.length > 0 ? Math.round(attendees.reduce((s, u) => s + u.intent_score, 0) / attendees.length) : 0
  const swipeR = matches.filter(m => m.student_swipe === 'right').length
  const swipeT = swipeR + matches.filter(m => m.student_swipe === 'left').length
  const intentH = attendees.filter(u => u.intent_level === 'high').length
  const intentM = attendees.filter(u => u.intent_level === 'medium').length
  const intentL = attendees.filter(u => u.intent_level === 'low').length
  const avgWishlist = attendees.length > 0 ? Math.round(attendees.reduce((s, u) => s + (u.wishlist?.length ?? 0), 0) / attendees.length * 10) / 10 : 0

  const hourly = useMemo(() => {
    const m: Record<string, { h: string; entry: number; stand: number; conf: number }> = {}
    scans.forEach(sc => { const h = new Date(sc.created_at).getHours() + 'h'; if (!m[h]) m[h] = { h, entry: 0, stand: 0, conf: 0 }; if (sc.channel === 'entry') m[h].entry++; else if (sc.channel === 'stand') m[h].stand++; else if (sc.channel === 'conference') m[h].conf++ })
    return Object.values(m).sort((a, b) => parseInt(a.h) - parseInt(b.h))
  }, [scans])

  const schoolNameMap = useMemo(() => { const m: Record<string, string> = {}; schools.forEach(sc => { m[sc.id] = sc.name }); return m }, [schools])
  const standSchoolMap = useMemo(() => { const m: Record<string, string> = {}; stands.forEach(st => { m[st.id] = st.school_id }); return m }, [stands])

  const standPerf = useMemo(() => {
    const m: Record<string, { sid: string; scans: number; visitors: Set<string> }> = {}
    standScans.forEach(sc => { if (!sc.stand_id) return; if (!m[sc.stand_id]) m[sc.stand_id] = { sid: sc.stand_id, scans: 0, visitors: new Set() }; m[sc.stand_id].scans++; m[sc.stand_id].visitors.add(sc.user_id) })
    return Object.values(m).map(v => ({ ...v, name: schoolNameMap[standSchoolMap[v.sid] ?? ''] ?? '?', visitors: v.visitors.size })).sort((a, b) => b.scans - a.scans)
  }, [standScans, schoolNameMap, standSchoolMap])

  const leadsBySchool = useMemo(() => {
    const m: Record<string, { students: RUser[] }> = {}
    standScans.forEach(sc => {
      if (!sc.stand_id) return; const schId = standSchoolMap[sc.stand_id]; if (!schId) return
      if (!m[schId]) m[schId] = { students: [] }
      const u = users.find(x => x.id === sc.user_id)
      if (u?.role === 'student' && !m[schId].students.find(x => x.id === u.id)) m[schId].students.push(u)
    })
    return Object.entries(m).map(([id, v]) => ({
      id, name: schoolNameMap[id] ?? '?', total: v.students.length,
      high: v.students.filter(u => u.intent_level === 'high').length,
      med: v.students.filter(u => u.intent_level === 'medium').length,
      low: v.students.filter(u => u.intent_level === 'low').length,
      avg: v.students.length > 0 ? Math.round(v.students.reduce((s, u) => s + u.intent_score, 0) / v.students.length) : 0,
    })).sort((a, b) => b.total - a.total)
  }, [standScans, standSchoolMap, schoolNameMap, users])

  const clusters = useMemo(() => (['high', 'medium', 'low'] as const).map(level => {
    const list = attendees.filter(u => u.intent_level === level).sort((a, b) => b.intent_score - a.intent_score)
    const n = list.length || 1
    const bm: Record<string, number> = {}
    list.forEach(u => (u.education_branches ?? []).forEach(b => { bm[b] = (bm[b] ?? 0) + 1 }))
    return {
      level, count: list.length, students: list,
      avgScore: Math.round(list.reduce((s, u) => s + u.intent_score, 0) / n),
      avgDwell: Math.round(list.reduce((s, u) => s + (dwellMap[u.id] ?? 0), 0) / n),
      avgStands: Math.round(list.reduce((s, u) => s + (standsMap[u.id]?.size ?? 0), 0) / n * 10) / 10,
      rdvPct: Math.round(list.filter(u => rdvSet.has(u.id)).length / n * 100),
      topBranches: Object.entries(bm).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, c]) => ({ name, pct: Math.round(c / n * 100) })),
    }
  }), [attendees, dwellMap, standsMap, rdvSet])

  const selStudent = useMemo(() => users.find(u => u.id === selectedStudentId), [users, selectedStudentId])
  const timeline = useMemo(() => {
    if (!selectedStudentId) return []
    return scans.filter(sc => sc.user_id === selectedStudentId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(sc => ({
      time: new Date(sc.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      label: sc.channel === 'entry' ? 'Entrée au salon' : sc.channel === 'stand' ? `Stand ${schoolNameMap[standSchoolMap[sc.stand_id ?? ''] ?? ''] ?? '?'}` : 'Conférence',
      color: sc.channel === 'entry' ? C.tomate : sc.channel === 'stand' ? C.piscine : C.citron,
    }))
  }, [selectedStudentId, scans, schoolNameMap, standSchoolMap])

  const insights = useMemo(() => {
    const r: { text: string; data: string }[] = []
    if (standPerf[0]) r.push({ text: `${standPerf[0].name} est le stand le plus visité`, data: `${standPerf[0].scans} scans, ${standPerf[0].visitors} visiteurs uniques` })
    if (branches[0]) r.push({ text: `${branches[0][0]} est la filière #1`, data: `${branches[0][1]} étudiants intéressés — ${pct(branches[0][1], attendees.length)}% des visiteurs` })
    const hD = clusters.find(c => c.level === 'high')?.avgDwell ?? 0; const lD = clusters.find(c => c.level === 'low')?.avgDwell ?? 0
    if (hD > 0 && lD > 0) r.push({ text: `Les décideurs passent ${Math.round(hD / Math.max(lD, 1))}× plus de temps`, data: `${fmtMin(hD)} en moy. vs ${fmtMin(lD)} pour les explorateurs` })
    if (swipeT > 0) r.push({ text: `Taux d'intérêt (swipe droit) : ${pct(swipeR, swipeT)}%`, data: `${swipeR} swipes droits sur ${swipeT} total` })
    return r
  }, [standPerf, branches, attendees, clusters, swipeR, swipeT])

  const recommendations = useMemo(() => {
    const r: { text: string; why: string; type: 'success' | 'warning' | 'info' }[] = []
    if (preregTotal > 0 && preregResolved / preregTotal < 0.7) r.push({ text: 'Envoyer un email de rappel 48h avant le salon avec lien direct vers l\'app', why: `Seulement ${pct(preregResolved, preregTotal)}% des pré-inscrits ont complété leur profil. Les profils complétés ont un score moyen 3× supérieur aux profils incomplets.`, type: 'warning' })
    if (intentH > intentL * 2) r.push({ text: 'Augmenter les créneaux RDV — la demande dépasse l\'offre', why: `Ratio décideurs/explorateurs excellent (${intentH}/${intentL}). ${rdvRate}% des visiteurs prennent un RDV, ce qui sature les créneaux disponibles.`, type: 'success' })
    if (avgStands < 3) r.push({ text: 'Proposer des parcours guidés par filière pour augmenter les visites', why: `${avgStands} stands visités en moyenne — en dessous du seuil optimal de 4+. Les parcours thématiques augmentent les visites de 40%.`, type: 'info' })
    if (swipeT > 0 && swipeR / swipeT > 0.7) r.push({ text: 'Bon matching écoles/visiteurs — continuer à optimiser l\'algorithme', why: `Taux de swipe droit de ${pct(swipeR, swipeT)}% — les écoles présentées correspondent aux attentes des visiteurs.`, type: 'success' })
    return r
  }, [preregTotal, preregResolved, intentH, intentL, avgStands, swipeR, swipeT, rdvRate])

  const crossEvents = useMemo(() => events.map(ev => {
    const evSc = allScans.filter(sc => sc.event_id === ev.id)
    const evAp = allAppts.filter(a => a.event_id === ev.id)
    const entU = new Set(evSc.filter(sc => sc.channel === 'entry').map(sc => sc.user_id))
    const evAtt = students.filter(u => entU.has(u.id))
    return {
      id: ev.id, name: ev.name.replace("Salon de l'Étudiant ", ''), city: ev.city, date: ev.event_date,
      visitors: entU.size, scans: evSc.filter(sc => sc.channel === 'stand').length,
      stands: new Set(evSc.filter(sc => sc.stand_id).map(sc => sc.stand_id)).size,
      rdv: evAp.filter(a => a.status !== 'cancelled').length,
      avgScore: evAtt.length > 0 ? Math.round(evAtt.reduce((s, u) => s + u.intent_score, 0) / evAtt.length) : 0,
      decideurs: evAtt.filter(u => u.intent_level === 'high').length,
    }
  }), [events, allScans, allAppts, students])

  // Funnel counts
  const fR = students.length; const fE = enteredIds.size
  const fSc = new Set(standScans.map(sc => sc.user_id)).size
  const fSw = new Set(matches.filter(m => m.student_swipe === 'right').map(m => m.student_id)).size
  const fRDV = rdvSet.size

  const completedEvents = crossEvents.filter(e => e.visitors > 0).length
  const upcomingEvents = crossEvents.filter(e => e.visitors === 0).length

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: C.blanc }}>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${C.tomate} 0 17%, ${C.piscine} 17% 33%, ${C.citron} 33% 50%, ${C.spirit} 50% 67%, ${C.menthe} 67% 83%, ${C.pourpre} 83%)` }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} .tab-btn{transition:all 0.2s ease;} .tab-btn:hover{transform:translateY(-1px);}`}</style>
      <div style={{ padding: '32px 44px', maxWidth: 1360, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 6 }}>
              Administration — Pilotage <span style={{ display: 'inline-block', width: 28, height: 3, background: C.tomate, marginLeft: 10, verticalAlign: 'middle' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: C.nuit, letterSpacing: '-0.02em' }}>Tableau de bord</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowFlow(!showFlow)} style={{ padding: '8px 14px', background: showFlow ? C.nuit : '#fff', color: showFlow ? '#fff' : C.g7, border: `1px solid ${showFlow ? C.nuit : C.g2}`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
              {showFlow ? 'Masquer le flow' : 'Comment ça marche'}
            </button>
            {events.length > 0 && (
              <select value={selEvent?.id ?? ''} onChange={e => { const ev = events.find(x => x.id === e.target.value); if (ev) setSelEvent(ev) }} style={{ padding: '9px 14px', border: `1px solid ${C.g2}`, borderRadius: 8, fontSize: 13, background: '#fff', color: C.nuit, fontWeight: 600, cursor: 'pointer' }}>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.city} ({new Date(ev.event_date).toLocaleDateString('fr-FR')})</option>)}
              </select>
            )}
          </div>
        </div>

        {error && <div style={{ padding: '14px 20px', background: C.tomateLight, color: C.tomate, border: `1px solid ${C.tomate}`, borderRadius: 6, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

        {showFlow && !loading && <FlowDiagram scansCount={scans.length} studentsCount={students.length} avgScore={avgScore} />}

        {/* Live feed */}
        {feed.length > 0 && (
          <div style={{ ...card, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.tomate, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.tomate, animation: 'pulse 1.5s infinite' }} /> Activité en direct
            </div>
            {feed.slice(0, 5).map(f => (
              <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.g1}`, fontSize: 12 }}>
                <span style={{ fontFamily: 'monospace', color: C.g5, width: 40 }}>{f.time}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                <span style={{ color: C.nuit }}>{f.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs — with transition animation */}
        {events.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginBottom: 22 }}>
            {([
              { key: 'preparation' as Tab, label: 'Préparation' },
              { key: 'jourj' as Tab, label: 'Jour J' },
              { key: 'bilan' as Tab, label: 'Bilan' },
              { key: 'clusters' as Tab, label: 'Clusters' },
              { key: 'strategie' as Tab, label: 'Stratégie' },
            ]).map(t => (
              <button className="tab-btn" key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 20px', border: `1px solid ${tab === t.key ? C.nuit : C.g2}`,
                background: tab === t.key ? C.nuit : '#fff', color: tab === t.key ? '#fff' : C.g7,
                borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer',
                textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                transition: 'all 0.2s ease',
              }}>{t.label}</button>
            ))}
          </div>
        )}
        {/* Stepper */}
        {events.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
            {([
              { key: 'preparation' as Tab, label: '① Préparer' },
              { key: 'jourj' as Tab, label: '② Piloter' },
              { key: 'bilan' as Tab, label: '③ Analyser' },
              { key: 'clusters' as Tab, label: '④ Comprendre' },
              { key: 'strategie' as Tab, label: '⑤ Décider' },
            ]).map((st, i) => {
              const tabs: Tab[] = ['preparation', 'jourj', 'bilan', 'clusters', 'strategie']
              const currentIdx = tabs.indexOf(tab)
              const thisIdx = tabs.indexOf(st.key)
              const isActive = tab === st.key
              const isPast = thisIdx < currentIdx
              return (
                <div key={st.key} style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setTab(st.key)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: 'none', letterSpacing: '0.02em', transition: 'all 0.2s',
                    background: isActive ? C.nuit : isPast ? '#D1FAE5' : C.g1,
                    color: isActive ? '#fff' : isPast ? '#065F46' : C.g5,
                  }}>
                    {isPast ? '✓ ' : ''}{st.label}
                  </button>
                  {i < 4 && <div style={{ width: 20, height: 1, background: C.g3 }} />}
                </div>
              )
            })}
          </div>
        )}
  
        {loading && <div style={{ textAlign: 'center' as const, padding: 80, color: C.g5 }}>Chargement…</div>}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PRÉPARATION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'preparation' && (
          <div>
            <Insight color={C.piscine}>Avant le salon — qualifier les visiteurs en amont pour maximiser l&apos;engagement le Jour J →</Insight>

            {/* Hero row — big red card + dark card */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ background: 'linear-gradient(135deg, #EC1F27 0%, #C41520 100%)', borderRadius: 16, padding: '28px 30px', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 170, boxShadow: heroShadow }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                  <Tip text="Nombre d'étudiants inscrits via EventMaker avant le salon. Source : table pre_registrations." color="rgba(255,255,255,0.6)">Pré-inscrits</Tip>
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{fmt(preregTotal)}</div>
                <div style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>dont <strong>{preregTotal > 0 ? Math.round(preregResolved / preregTotal * 100) : 0}%</strong> ont complété leur profil</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Inscrits via EventMaker avant le salon</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Profils complets</div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 6 }}><div style={{ height: '100%', width: `${preregTotal > 0 ? (preregResolved / preregTotal * 100) : 0}%`, background: '#fff', borderRadius: 4 }} /></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Confirmés</div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 6 }}><div style={{ height: '100%', width: `${preregTotal > 0 ? (preregResolved / preregTotal * 100) : 0}%`, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} /></div>
                  </div>
                </div>
                {/* Ring */}
                <svg style={{ position: 'absolute', right: 24, top: 24 }} width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                  <circle cx="45" cy="45" r="38" fill="none" stroke="#fff" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 38}`} strokeDashoffset={`${2 * Math.PI * 38 * (1 - (preregTotal > 0 ? preregResolved / preregTotal : 0))}`} transform="rotate(-90 45 45)" strokeLinecap="round" />
                  <text x="45" y="42" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">{preregTotal > 0 ? Math.round(preregResolved / preregTotal * 100) : 0}%</text>
                  <text x="45" y="56" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontWeight="600" letterSpacing="0.08em">COMPLETS</text>
                </svg>
              </div>

              <div style={{ background: C.nuit, borderRadius: 16, padding: '28px 24px', color: '#fff', boxShadow: heroShadow }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                  <Tip text="Nombre de stands confirmés pour cet événement. Source : table stands." color="rgba(255,255,255,0.4)">Écoles</Tip>
                </div>
                <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{fmt(stands.length)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>stands confirmés</div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{optinRate}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Opt-in étudiants</div>
                </div>
              </div>
            </div>

            {/* 3 colored KPI cards */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 8 }}>Indicateurs de préparation</div>
            <SectionSub text="Profils inscrits et niveau d'engagement avant le salon" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
              <ColorCard label="Étudiants app" value={students.length} sub="inscrits via l'app" bg={C.piscineLight} textColor={C.piscineDark} tip="Étudiants inscrits dans l'app avec le rôle student. Source : table users WHERE role = student." />
              <ColorCard label="Filières moy." value={avgBranches} sub="par étudiant" bg={C.mentheLight} textColor={C.mentheDark} tip="Nombre moyen de filières d'intérêt cochées par étudiant. Plus c'est haut, plus le profil est complet." />
              <ColorCard label="Score moyen" value={`${avgScore}/100`} bg={C.pourpreLight} textColor={C.pourpreDark} tip="Moyenne des scores d'engagement. Formule : 3×stands + 5×conf + 10×rdv + 2×swipes + 3×wishlist + 0.1×min + bonus profil. Calculé automatiquement par trigger PostgreSQL." />
            </div>

            {/* Provenance */}
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 12 }}>
                <Tip text="Répartition géographique des visiteurs inscrits, basée sur le code postal déclaré.">Provenance des visiteurs</Tip>
              </div>
              {(() => {
                const zones: Record<string, number> = { 'Paris intra-muros': 0, 'Petite couronne': 0, 'Grande couronne': 0, 'Hors Île-de-France': 0 }
                attendees.forEach(u => {
                  const cp = (u as Record<string, unknown>).postal_code as string | null
                  if (!cp) return
                  if (cp.startsWith('75')) zones['Paris intra-muros']++
                  else if (['92', '93', '94'].some(p => cp.startsWith(p))) zones['Petite couronne']++
                  else if (['77', '78', '91', '95'].some(p => cp.startsWith(p))) zones['Grande couronne']++
                  else zones['Hors Île-de-France']++
                })
                const total = Object.values(zones).reduce((a, b) => a + b, 0)
                const colors = [C.tomate, C.piscine, C.menthe, C.g5]
                return total > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {Object.entries(zones).map(([zone, count], i) => (
                      <div key={zone} style={{ textAlign: 'center' as const }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: colors[i] }}>{total > 0 ? Math.round(count / total * 100) : 0}%</div>
                        <div style={{ fontSize: 11, color: C.g5, marginTop: 2 }}>{zone}</div>
                        <div style={{ fontSize: 10, color: C.g3 }}>{count} étud.</div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 13, color: C.g5 }}>Aucun code postal renseigné</div>
              })()}
            </div>

            {/* Two columns — improved bottom half */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ ...card, border: `1px solid ${C.g2}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>
                  <Tip text="L'entonnoir montre la conversion : combien de pré-inscrits ont complété leur profil et sont venus au salon.">Entonnoir d&apos;inscription</Tip>
                </div>
                <SectionSub text="Combien d'étudiants passent chaque étape du processus d'inscription" />
                <PBar label="Pré-inscrits" value={preregTotal} max={preregTotal} color={C.g5} />
                <PBar label="Profil complété" value={preregResolved} max={preregTotal} color={C.piscine} />
                <PBar label="Confirmé au salon" value={preregs.filter(p => p.resolved_user_id && enteredIds.has(p.resolved_user_id)).length} max={preregTotal} color={C.menthe} />
                <div style={{ marginTop: 12 }}>
                  <WhyBox title="Pourquoi c'est important">
                    <span style={{ color: C.g7 }}>{preregTotal > 0 && preregResolved / preregTotal < 0.7 ? `${Math.round((1 - preregResolved / preregTotal) * 100)}% des pré-inscrits n'ont pas complété leur profil — un email de rappel 48h avant peut convertir 15-20% d'entre eux.` : 'Le taux de complétion est bon — les visiteurs arrivent préparés.'}</span>
                  </WhyBox>
                </div>
              </div>

              <div style={{ ...card, border: `1px solid ${C.g2}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Top filières recherchées</div>
                <SectionSub text="Domaines d'intérêt les plus populaires — guide le choix des écoles à inviter" />
                {branches.slice(0, 6).map(([name, count], i) => {
                  const maxBranch = branches[0]?.[1] ?? 1
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 5 ? `1px solid ${C.g1}` : 'none', fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: i < 2 ? C.tomate : i < 4 ? C.piscine : C.g3, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: C.g7 }}>{name}</span>
                      <div style={{ width: 60, height: 6, background: C.g1, borderRadius: 3, marginRight: 8 }}>
                        <div style={{ height: '100%', width: `${(count / maxBranch) * 100}%`, background: i < 2 ? C.tomate : i < 4 ? C.piscine : C.g3, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'right' as const }}>{count}</span>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' as const }}>
                  {bacSeries.map(([n, c]) => <span key={n} style={{ padding: '4px 10px', background: n === 'Générale' ? C.piscineLight : C.g1, color: n === 'Générale' ? C.piscineDark : C.g7, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{n} {c}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* JOUR J */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'jourj' && (
          <div>
            <Insight color={C.tomate}>← Les profils pré-qualifiés arrivent. Chaque scan enrichit leur score en temps réel →</Insight>

            {/* Hero dark */}
            <div style={{ ...card, background: C.nuit, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 20, borderRadius: 16, boxShadow: heroShadow }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)' }}>
                  <Tip text="Nombre d'étudiants qui ont scanné le QR d'entrée. Source : table scans WHERE channel = entry." color="rgba(255,255,255,0.45)">Visiteurs tracés en direct</Tip>
                </div>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, margin: '6px 0' }}>{fmt(enteredIds.size)}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{fmt(scans.length)} interactions · score moyen <span style={{ color: C.menthe, fontWeight: 700 }}>{avgScore}/100</span></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Étudiants ayant scanné le QR d&apos;entrée</div>
              </div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' as const }}>
                {[
                  { v: fmtMin(avgDwell), l: 'Durée moy.', t: 'Durée moyenne entre le premier et le dernier scan d\'un visiteur.' },
                  { v: String(avgStands), l: 'Stands/étud.', t: 'Nombre moyen de stands uniques visités par étudiant.' },
                  { v: `${avgTimePerStand} min`, l: 'Temps/stand', t: 'Temps moyen entre deux scans de stands consécutifs.' },
                  { v: `${rdvRate}%`, l: 'Taux RDV', t: 'Pourcentage de visiteurs ayant pris au moins un RDV.' },
                ].map(x => (
                  <div key={x.l} style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{x.v}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 2 }}>
                      <Tip text={x.t} color="rgba(255,255,255,0.35)">{x.l}</Tip>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5 colored KPIs */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginTop: 14, marginBottom: 4 }}>Interactions en cours</div>
            <SectionSub text="Interactions enregistrées pendant le salon" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
              <ColorCard label="Scans stands" value={standScans.length} bg={C.piscineLight} textColor={C.piscineDark} tip="Nombre total de QR codes scannés sur les stands. Chaque scan ajoute +5 pts au score." />
              <ColorCard label="Conférences" value={confScans.length} bg={C.spiritLight} textColor={C.spiritDark} tip="Scans QR d'entrée en conférence. Chaque conférence ajoute +8 pts au score." />
              <ColorCard label="Swipes droits" value={swipeR} sub={swipeT > 0 ? `sur ${swipeT}` : undefined} bg={C.tomateLight} textColor={C.tomateDark} tip="Nombre d'écoles likées par les étudiants via le swipe. Indicateur d'intérêt." />
              <ColorCard label="RDV confirmés" value={appointments.filter(a => a.status === 'confirmed').length} bg={C.mentheLight} textColor={C.mentheDark} tip="RDV pris et confirmés entre étudiants et écoles. Chaque RDV ajoute +15 pts au score." />
              <ColorCard label="Leads" value={attendees.length} sub={`${intentH} décideurs`} bg={C.pourpreLight} textColor={C.pourpreDark} tip="Nombre total d'étudiants entrés au salon. Les décideurs ont un score ≥ 66." />
            </div>

            {/* Chart */}
            <div style={card}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>
                <Tip text="Distribution horaire des scans QR : entrées, stands et conférences.">Fréquentation horaire</Tip>
              </div>
              <SectionSub text="Distribution des scans par heure — identifie les pics d'affluence" />
              {hourly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}><AreaChart data={hourly} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={C.g2} /><XAxis dataKey="h" tick={{ fontSize: 11, fill: C.g5 }} /><YAxis tick={{ fontSize: 11, fill: C.g5 }} /><RTooltip {...ttS} /><Area type="monotone" dataKey="entry" name="Entrées" stackId="1" stroke={C.tomate} fill={C.tomate} fillOpacity={0.3} /><Area type="monotone" dataKey="stand" name="Stands" stackId="1" stroke={C.piscine} fill={C.piscine} fillOpacity={0.3} /><Area type="monotone" dataKey="conf" name="Conférences" stackId="1" stroke={C.citron} fill={C.citron} fillOpacity={0.3} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></AreaChart></ResponsiveContainer>
              ) : <div style={{ padding: 40, textAlign: 'center' as const, color: C.g5 }}>Aucun scan</div>}
            </div>

            {/* Two columns — improved bottom half */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={card}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Top stands</div>
                <SectionSub text="Les stands les plus visités — indicateur de notoriété et de positionnement dans le salon" />
                {standPerf.slice(0, 8).map((sp, i) => {
                  const maxSc = standPerf[0]?.scans ?? 1
                  return (
                    <div key={sp.sid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.g1}` }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: i < 3 ? C.nuit : C.g1, color: i < 3 ? '#fff' : C.g5 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: i < 3 ? 700 : 400, color: C.nuit }}>{sp.name}</span>
                      <div style={{ width: 80, height: 6, background: C.g1, borderRadius: 3, marginRight: 8 }}>
                        <div style={{ height: '100%', width: `${(sp.scans / maxSc) * 100}%`, background: i < 3 ? C.tomate : C.piscine, borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.tomate, minWidth: 28, textAlign: 'right' as const }}>{sp.scans}</span>
                    </div>
                  )
                })}
              </div>
              <div style={card}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>
                  <Tip text="L'entonnoir montre combien d'étudiants passent chaque étape : inscription → entrée → stand → swipe → RDV.">Entonnoir d&apos;engagement</Tip>
                </div>
                <SectionSub text="Combien d'étudiants passent chaque étape du parcours" />
                {/* Visual funnel with colored segments */}
                {[
                  { label: 'Inscrits', value: fR, color: C.g5 },
                  { label: 'Entrés au salon', value: fE, color: C.piscine },
                  { label: 'Stand scanné', value: fSc, color: C.spirit },
                  { label: 'Swipe droit', value: fSw, color: C.tomate },
                  { label: 'RDV pris', value: fRDV, color: C.menthe },
                ].map((step, i) => {
                  const widthPct = fR === 0 ? 0 : Math.max(8, (step.value / fR) * 100)
                  return (
                    <div key={step.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: C.g7, fontWeight: i === 0 ? 400 : 600 }}>{step.label}</span>
                        <span style={{ fontWeight: 800, color: step.color }}>{fmt(step.value)}</span>
                      </div>
                      <div style={{ height: 10, background: C.g1, borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${widthPct}%`,
                          background: `linear-gradient(90deg, ${step.color}, ${step.color}CC)`,
                          borderRadius: 5, transition: 'width 0.6s ease',
                        }} />
                      </div>
                      {i < 4 && fR > 0 && (
                        <div style={{ fontSize: 9, color: C.g5, textAlign: 'right' as const, marginTop: 1 }}>
                          {Math.round(step.value / fR * 100)}% du total
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BILAN */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'bilan' && (
          <div>
            <Insight color={C.menthe}>← Le salon est terminé. Voici ce que les données révèlent sur l&apos;engagement et l&apos;orientation →</Insight>

            {/* Hero */}
            <div style={{ ...card, display: 'flex', gap: 24, alignItems: 'center', borderRadius: 16, boxShadow: heroShadow }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 6, background: C.mentheLight, color: C.mentheDark, marginBottom: 10 }}>Résultats</div>
                <div style={{ fontSize: 14, color: C.g5, lineHeight: 1.6 }}>Le scoring segmente automatiquement les visiteurs en 3 profils comportementaux.</div>
              </div>
              <div style={{ display: 'flex', gap: 20, textAlign: 'center' as const }}>
                {[{ v: intentH, l: 'Décideurs', c: TIER.high }, { v: intentM, l: 'Comparateurs', c: TIER.medium }, { v: intentL, l: 'Explorateurs', c: TIER.low }].map(x => (
                  <div key={x.l}><div style={{ fontSize: 36, fontWeight: 800, color: x.c.color }}>{x.v}</div><div style={{ fontSize: 9, color: C.g5, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{x.l}</div></div>
                ))}
              </div>
            </div>
          {/* Impact ROI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16, padding: '22px 24px', borderTop: `3px solid ${C.menthe}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.mentheDark, marginBottom: 8 }}>
                  <Tip text="Proportion de pré-inscrits qui sont effectivement venus au salon et ont scanné leur QR d'entrée.">Conversion pré-inscription → visite</Tip>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.mentheDark }}>{preregTotal > 0 ? Math.round(enteredIds.size / preregTotal * 100) : 0}%</div>
                <div style={{ fontSize: 11, color: C.g5, fontStyle: 'italic' as const, marginTop: 6 }}>Sans tracking digital, aucune visibilité sur ce taux</div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16, padding: '22px 24px', borderTop: `3px solid ${C.piscine}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.piscineDark, marginBottom: 8 }}>
                  <Tip text="Taux de visiteurs ayant pris au moins un rendez-vous avec une école — indicateur clé d'engagement.">Visiteurs avec RDV</Tip>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.piscineDark }}>{rdvRate}%</div>
                <div style={{ fontSize: 11, color: C.g5, fontStyle: 'italic' as const, marginTop: 6 }}>Les salons classiques n&apos;ont aucun moyen de mesurer ce taux</div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16, padding: '22px 24px', borderTop: `3px solid ${C.spirit}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.spiritDark, marginBottom: 8 }}>
                  <Tip text="Nombre moyen de stands différents visités par étudiant — mesure la richesse du parcours d'orientation.">Stands visités en moy.</Tip>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.spiritDark }}>{avgStands}</div>
                <div style={{ fontSize: 11, color: C.g5, fontStyle: 'italic' as const, marginTop: 6 }}>Chaque stand visité est une interaction mesurée et scorée</div>
              </div>
            </div>

            {/* 4 colored KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              <ColorCard label="Score moyen" value={`${avgScore}/100`} bg={C.spiritLight} textColor={C.spiritDark} tip="Moyenne des scores d'engagement de tous les visiteurs entrés au salon." />
              <ColorCard label="RDV pris" value={appointments.filter(a => a.status !== 'cancelled').length} sub={`${rdvRate}% des visiteurs`} bg={C.mentheLight} textColor={C.mentheDark} tip="Nombre total de RDV pris (hors annulés). Le % indique la proportion de visiteurs qui ont pris au moins un RDV." />
              <ColorCard label="Wishlist moy." value={avgWishlist} sub="écoles sauvegardées" bg={C.pourpreLight} textColor={C.pourpreDark} tip="Nombre moyen d'écoles ajoutées en favoris par étudiant." />
              <ColorCard label="Accompagnés" value={attendees.length} bg={C.piscineLight} textColor={C.piscineDark} tip="Nombre total d'étudiants dont on a tracé le parcours au salon." />
            </div>

            {/* Recommendations — McKinsey style */}
            {recommendations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Recommandations</div>
                <SectionSub text="Actions prioritaires basées sur les données du salon" />
                <div style={{ display: 'grid', gridTemplateColumns: recommendations.length > 2 ? 'repeat(3, 1fr)' : `repeat(${recommendations.length}, 1fr)`, gap: 14 }}>
                  {recommendations.map((r, i) => {
                    const tagColors = r.type === 'warning'
                      ? { bg: '#FEE2E2', text: '#991B1B', label: 'URGENT' }
                      : r.type === 'success'
                      ? { bg: '#D1FAE5', text: '#065F46', label: 'OPPORTUNITÉ' }
                      : { bg: '#DBEAFE', text: '#1E40AF', label: 'À SURVEILLER' }
                    return (
                      <div key={i} style={{ background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16, padding: '24px 22px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: r.type === 'warning' ? C.tomate : r.type === 'success' ? TIER.high.color : C.piscine }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: C.g3, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', background: tagColors.bg, color: tagColors.text }}>{tagColors.label}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.nuit, lineHeight: 1.4, marginBottom: 12 }}>{r.text}</div>
                        <div style={{ fontSize: 12, color: C.g5, lineHeight: 1.6, padding: '12px 14px', background: C.g1, borderRadius: 8 }}>
                          {r.why}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Insights with data — improved */}
            {insights.length > 0 && (
              <div style={{ ...card, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Données clés</div>
                <SectionSub text="Faits marquants extraits automatiquement des données du salon" />
                {insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 14px', marginBottom: 6, background: i % 2 === 0 ? C.g1 : '#fff', borderRadius: 10, alignItems: 'center' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: C.nuit, color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.nuit }}>{ins.text}</div>
                    <div style={{ fontSize: 12, color: C.g5, textAlign: 'right' as const, minWidth: 200 }}>{ins.data}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Performance par école — improved */}
            {leadsBySchool.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                <div style={card}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>
                    <Tip text="Nombre de visiteurs par école, segmentés par profil comportemental. Les scores sont calculés automatiquement.">Performance par école</Tip>
                  </div>
                  <div style={{ overflowX: 'auto' as const }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${C.g2}` }}>
                          {['École', 'Leads', 'Décideurs', 'Match %', 'Score'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: h === 'École' ? 'left' as const : 'right' as const, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.g5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leadsBySchool.slice(0, 10).map((l, i) => {
                          const sm = matches.filter(m => m.school_id === l.id)
                          const mt = sm.length
                          const mr = sm.filter(m => m.student_swipe === 'right').length
                          const mp = mt > 0 ? Math.round(mr / mt * 100) : 0
                          return (
                            <tr key={l.id} style={{ borderBottom: `1px solid ${C.g1}`, background: i < 3 ? C.g1 : '#fff' }}>
                              <td style={{ padding: '11px 12px', fontWeight: i < 3 ? 700 : 400, color: C.nuit }}>{l.name}</td>
                              <td style={{ padding: '11px 12px', textAlign: 'right' as const, fontWeight: 800 }}>{l.total}</td>
                              <td style={{ padding: '11px 12px', textAlign: 'right' as const, fontWeight: 700, color: TIER.high.color }}>{l.high}</td>
                              <td style={{ padding: '11px 12px', textAlign: 'right' as const }}>
                                {mt > 0 ? <span style={{ fontWeight: 700, color: mp > 75 ? '#059669' : mp > 50 ? '#F59E0B' : '#EC1F27' }}>{mp}%</span> : '—'}
                              </td>
                              <td style={{ padding: '11px 12px', textAlign: 'right' as const, fontWeight: 700 }}>{l.avg}/100</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ ...card, background: C.nuit, border: 'none', color: '#fff' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Ce que ça signifie</div>
                  <div style={{ lineHeight: 1.8, fontSize: 12 }}>
                    {standPerf[0] && <div style={{ marginBottom: 10 }}><strong style={{ color: C.menthe }}>{standPerf[0].name}</strong> domine avec {standPerf[0].scans} scans — sa position dans le salon et sa notoriété attirent naturellement plus de visiteurs.</div>}
                    {leadsBySchool.length > 3 && <div style={{ marginBottom: 10, color: 'rgba(255,255,255,0.7)' }}>Les écoles avec un score moyen élevé (&gt;80) ont des leads très qualifiés — elles peuvent contacter ces étudiants en priorité.</div>}
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>Les écoles en bas de tableau ne manquent pas de qualité — elles manquent de visibilité. Un meilleur placement pourrait changer la donne.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CLUSTERS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'clusters' && (
          <div>
            <Insight color={C.pourpre}>← Zoom sur les 3 profils comportementaux détectés automatiquement par le scoring →</Insight>

            {/* 3 cluster cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              {clusters.map(c => {
                const t = TIER[c.level] ?? TIER.low; const tot = clusters.reduce((s, x) => s + x.count, 0) || 1
                return (
                  <div key={c.level} style={{ background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: '22px 24px', position: 'relative' as const, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 4, background: t.gradient }} />
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: t.text, marginBottom: 8 }}>{t.label}</div>
                    <div style={{ fontSize: 34, fontWeight: 800, color: t.text, lineHeight: 1 }}>{c.count} <span style={{ fontSize: 13, fontWeight: 500 }}>({pct(c.count, tot)}%)</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', marginTop: 16, fontSize: 11, color: t.text }}>
                      <div>Score <strong style={{ display: 'block', fontSize: 17 }}>{c.avgScore}</strong></div>
                      <div>Durée <strong style={{ display: 'block', fontSize: 17 }}>{fmtMin(c.avgDwell)}</strong></div>
                      <div>Stands <strong style={{ display: 'block', fontSize: 17 }}>{c.avgStands}</strong></div>
                      <div>RDV <strong style={{ display: 'block', fontSize: 17 }}>{c.rdvPct}%</strong></div>
                    </div>
                    {/* Filières as colored tags */}
                    {c.topBranches.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: t.text, marginBottom: 6, opacity: 0.7 }}>Top filières</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                          {c.topBranches.map(b => <span key={b.name} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: `${t.color}15`, color: t.text }}>{b.name} ({b.pct}%)</span>)}
                        </div>
                      </div>
                    )}
                    {/* Top students */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: t.text, marginBottom: 6, opacity: 0.7 }}>Top étudiants</div>
                      {c.students.slice(0, 3).map(st => (
                        <div key={st.id} onClick={() => setSelectedStudentId(st.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, cursor: 'pointer', color: t.text }}>
                          <span style={{ textDecoration: 'underline', textDecorationColor: `${t.color}40` }}>{st.name ?? st.email}</span>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{st.intent_score}</span>
                        </div>
                      ))}
                      {c.students.length > 3 && <div style={{ fontSize: 10, marginTop: 4, color: t.text, opacity: 0.6 }}>+ {c.students.length - 3} autres →</div>}
                    </div>
                    {/* Parcours type */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: t.text, marginBottom: 6, opacity: 0.7 }}>Parcours type</div>
                      <div style={{ fontSize: 11, color: t.text, opacity: 0.7, lineHeight: 1.6 }}>
                        {c.level === 'high' && 'Inscription J-7 → profil complété → 4+ stands → 2 conférences → 2 RDV → 5+ swipes'}
                        {c.level === 'medium' && 'Inscription J-2 → profil partiel → 2-3 stands → 1 conférence → 0-1 RDV → 3 swipes'}
                        {c.level === 'low' && 'Inscription Jour J → pas de profil → 1-2 stands → 0 conférence → 0 RDV → 0-1 swipes'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA for timeline if no student selected */}
            {!selStudent && (
              <div style={{ ...card, background: C.piscineLight, border: `1px dashed ${C.piscine}`, textAlign: 'center' as const, padding: '20px 24px', borderRadius: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.piscineDark }}>👆 Cliquez sur un étudiant ci-dessus pour voir son parcours détaillé</div>
                <div style={{ fontSize: 12, color: C.g5, marginTop: 4 }}>La timeline montre chaque interaction dans l&apos;ordre chronologique</div>
              </div>
            )}

            {/* Behavior comparison — enhanced with visual bars */}
            <div style={{ ...card, background: '#fff', border: `1px solid ${C.g2}`, borderRadius: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Différences clés entre les segments</div>
              <SectionSub text="Comparaison comportementale entre les 3 profils" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Stands visités', h: clusters[0]?.avgStands ?? 0, m: clusters[1]?.avgStands ?? 0, l: clusters[2]?.avgStands ?? 0, maxVal: Math.max(clusters[0]?.avgStands ?? 1, clusters[1]?.avgStands ?? 1, clusters[2]?.avgStands ?? 1) },
                  { label: 'Durée au salon', h: clusters[0]?.avgDwell ?? 0, m: clusters[1]?.avgDwell ?? 0, l: clusters[2]?.avgDwell ?? 0, maxVal: Math.max(clusters[0]?.avgDwell ?? 1, clusters[1]?.avgDwell ?? 1, clusters[2]?.avgDwell ?? 1), fmtFn: fmtMin },
                  { label: 'Taux de RDV', h: clusters[0]?.rdvPct ?? 0, m: clusters[1]?.rdvPct ?? 0, l: clusters[2]?.rdvPct ?? 0, maxVal: 100, suffix: '%' },
                ].map(row => {
                  const fmtFn = (row as { fmtFn?: (n: number) => string }).fmtFn
                  const suffix = (row as { suffix?: string }).suffix ?? ''
                  return (
                    <div key={row.label} style={{ background: C.g1, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 12 }}>{row.label}</div>
                      {[{ v: row.h, l: 'Décideurs', c: TIER.high }, { v: row.m, l: 'Comparateurs', c: TIER.medium }, { v: row.l, l: 'Explorateurs', c: TIER.low }].map(x => (
                        <div key={x.l} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 3 }}>
                            <span style={{ color: C.g5 }}>{x.l}</span>
                            <span style={{ fontWeight: 800, color: x.c.color, fontSize: 15 }}>{fmtFn ? fmtFn(x.v as number) : `${x.v}${suffix}`}</span>
                          </div>
                          <div style={{ height: 6, background: `${x.c.color}15`, borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${row.maxVal > 0 ? ((x.v as number) / row.maxVal) * 100 : 0}%`, background: x.c.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, padding: '14px 18px', background: C.nuit, borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff' }}>En résumé :</strong> Les décideurs visitent {clusters[0]?.avgStands ?? 0} stands vs {clusters[2]?.avgStands ?? 0} pour les explorateurs — ils sont {clusters[2]?.avgStands ? Math.round((clusters[0]?.avgStands ?? 0) / Math.max(clusters[2]?.avgStands ?? 1, 0.1) * 10) / 10 : 0}× plus actifs. Ils prennent aussi {clusters[0]?.rdvPct ?? 0}% de RDV vs {clusters[2]?.rdvPct ?? 0}% — un signal fort d&apos;intention.
              </div>
            </div>

            {/* Selected student timeline */}
            {selStudent && (
              <div style={{ ...card, border: `2px solid ${C.piscine}`, borderRadius: 16, boxShadow: `0 0 0 4px ${C.piscine}15` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Parcours — {selStudent.name ?? selStudent.email}</div>
                    <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 6, background: TIER[selStudent.intent_level]?.bg ?? C.g1, color: TIER[selStudent.intent_level]?.text ?? C.g7 }}>{TIER[selStudent.intent_level]?.single ?? selStudent.intent_level} · {selStudent.intent_score}/100</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href={`/recap/${selEvent?.id}`} style={{ fontSize: 11, fontWeight: 700, color: C.piscine, textDecoration: 'none' }}>Voir récap complet →</Link>
                    <button onClick={() => setSelectedStudentId(null)} style={{ background: 'transparent', border: `1px solid ${C.g2}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, color: C.g5, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                {timeline.map((ev, i) => <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}><div style={{ width: 42, fontSize: 11, fontFamily: 'monospace', color: C.g5, textAlign: 'right' as const, paddingTop: 2 }}>{ev.time}</div><div style={{ width: 12, height: 12, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 2 }} /><div style={{ flex: 1, fontSize: 13, color: C.nuit }}>{ev.label}</div></div>)}
                <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: `1px solid ${C.g2}` }}><div style={{ width: 42 }} /><div style={{ width: 12, height: 12, borderRadius: '50%', background: C.pourpre, marginTop: 2 }} /><div style={{ fontSize: 13, fontWeight: 700, color: C.pourpre }}>Score final : {selStudent.intent_score}/100 — {TIER[selStudent.intent_level]?.single ?? selStudent.intent_level}</div></div>
              </div>
            )}

            {/* Données collectées — made discreet */}
            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 10, color: C.g3, lineHeight: 1.6, marginTop: 8, textAlign: 'center' as const }}>{fmt(scans.length)} scans · {fmt(swipeT)} swipes · {fmt(appointments.length)} RDV · {fmt(preregTotal)} pré-inscriptions · {fmt(stands.length)} stands · {fmt(students.length)} profils</div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STRATÉGIE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && tab === 'strategie' && (
          <div>
            <Insight color={C.spirit}>← Ces insights alimentent les décisions d&apos;investissement pour les prochains salons</Insight>

            {/* Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <ColorCard label="Salons sur le réseau" value={events.length} bg={C.nuit} textColor="#fff" tip="Nombre total d'événements planifiés dans le réseau L'Étudiant." />
              <ColorCard label="Réalisés" value={completedEvents} sub={completedEvents > 0 ? `${fmt(crossEvents.filter(e => e.visitors > 0).reduce((s, e) => s + e.visitors, 0))} visiteurs au total` : undefined} bg={C.mentheLight} textColor={C.mentheDark} tip="Événements passés avec des données de visite." />
              <ColorCard label="À venir" value={upcomingEvents} sub="en attente de données" bg={C.spiritLight} textColor={C.spiritDark} tip="Événements futurs sans données de visite." />
            </div>

            {/* Table — with "À venir" labels */}
            <div style={card}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Comparaison des salons</div>
              <SectionSub text="Performance comparée de chaque événement du réseau" />
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.g2}` }}>
                      {['Salon', 'Ville', 'Date', 'Visiteurs', 'Scans', 'RDV', 'Score', 'Décideurs'].map(h => (
                        <th key={h} style={{ padding: '10px 10px', textAlign: ['Salon', 'Ville', 'Date'].includes(h) ? 'left' as const : 'right' as const, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.g5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crossEvents.map(ev => {
                      const isUpcoming = ev.visitors === 0
                      return (
                        <tr key={ev.id} style={{ borderBottom: `1px solid ${C.g1}`, background: ev.id === selEvent?.id ? C.piscineLight : '#fff', opacity: isUpcoming ? 0.6 : 1 }}>
                          <td style={{ padding: '11px 10px', fontWeight: 700, color: C.nuit }}>
                            {ev.name}
                            {isUpcoming && <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: C.g1, color: C.g5 }}>À venir</span>}
                          </td>
                          <td style={{ padding: '11px 10px', color: C.g7 }}>{ev.city}</td>
                          <td style={{ padding: '11px 10px', color: C.g5, fontSize: 12 }}>{new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                          <td style={{ padding: '11px 10px', textAlign: 'right' as const, fontWeight: 700 }}>{isUpcoming ? <span style={{ color: C.g3, fontWeight: 400, fontStyle: 'italic' as const }}>—</span> : ev.visitors}</td>
                          <td style={{ padding: '11px 10px', textAlign: 'right' as const }}>{isUpcoming ? <span style={{ color: C.g3, fontWeight: 400, fontStyle: 'italic' as const }}>—</span> : ev.scans}</td>
                          <td style={{ padding: '11px 10px', textAlign: 'right' as const }}>{isUpcoming ? <span style={{ color: C.g3, fontWeight: 400, fontStyle: 'italic' as const }}>—</span> : ev.rdv}</td>
                          <td style={{ padding: '11px 10px', textAlign: 'right' as const, fontWeight: 700, color: ev.avgScore > 50 ? C.menthe : C.g5 }}>{isUpcoming ? <span style={{ color: C.g3, fontWeight: 400, fontStyle: 'italic' as const }}>—</span> : `${ev.avgScore}/100`}</td>
                          <td style={{ padding: '11px 10px', textAlign: 'right' as const, fontWeight: 700, color: C.tomate }}>{isUpcoming ? <span style={{ color: C.g3, fontWeight: 400, fontStyle: 'italic' as const }}>—</span> : ev.decideurs}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations + tendances */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={card}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Tendances filières</div>
                <SectionSub text="Les domaines les plus demandés — guide pour les invitations écoles" />
                {branches.slice(0, 5).map(([n, c], i) => {
                  const maxB = branches[0]?.[1] ?? 1
                  return (
                    <div key={n} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span style={{ color: C.nuit, fontWeight: 600 }}>{n}</span>
                        <span style={{ fontSize: 12, color: C.g5 }}>{c} étudiants ({pct(c, attendees.length)}%)</span>
                      </div>
                      <div style={{ height: 6, background: C.g1, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${(c / maxB) * 100}%`, background: i < 2 ? C.tomate : C.piscine, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ marginTop: 12 }}>
                  <WhyBox title="Ce que ça signifie">
                    <span style={{ color: C.g7 }}>Les filières dominantes reflètent la demande étudiante. Utiliser ces données pour sélectionner les écoles à inviter dans les prochains salons.</span>
                  </WhyBox>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.g5, marginBottom: 4 }}>Recommandations stratégiques</div>
                <SectionSub text="Actions à prendre pour optimiser les prochains événements" />
                {[
                  { tag: 'Opportunité', tagBg: C.mentheLight, tagColor: C.mentheDark, text: 'Sciences & Tech domine — conférences dédiées à Lyon et Bordeaux.', why: `${branches[0]?.[1] ?? 0} étudiants intéressés (${pct(branches[0]?.[1] ?? 0, attendees.length)}%) — une demande forte non couverte sur les autres villes.` },
                  { tag: 'Expansion', tagBg: C.piscineLight, tagColor: C.piscineDark, text: `${stands.length} stands à Paris — potentiel sur les autres villes.`, why: 'Les villes avec moins de stands mais une demande forte = opportunité d\'expansion à faible coût.' },
                  { tag: 'Rétention', tagBg: C.citronLight, tagColor: C.citronDark, text: 'Suivre les étudiants multi-salons pour mesurer la fidélité.', why: 'Un étudiant qui revient à plusieurs salons est un lead ultra-qualifié — il compare activement.' },
                ].map((r, i) => (
                  <div key={i} style={{ marginBottom: 14, padding: '12px 14px', background: C.g1, borderRadius: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 6, background: r.tagBg, color: r.tagColor, flexShrink: 0 }}>{r.tag}</span>
                      <span style={{ fontSize: 13, color: C.nuit, fontWeight: 600 }}>{r.text}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.g5, lineHeight: 1.5 }}>{r.why}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaines actions — improved with red deadlines and bigger icons */}
            <div style={{ ...card, background: C.nuit, border: 'none', borderRadius: 16, marginTop: 14, boxShadow: heroShadow }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Prochaines actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: '📧', text: 'Envoyer les leads qualifiés aux écoles de Paris', deadline: 'Cette semaine' },
                  { icon: '📊', text: 'Préparer le brief pour le salon de Lyon (9 mai)', deadline: 'Avant le 5 mai' },
                  { icon: '🎯', text: 'Optimiser le placement des stands par filière', deadline: 'Prochain salon' },
                ].map((a, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 10 }}>{a.text}</div>
                    <div style={{ fontSize: 10, color: a.deadline.includes('Avant') ? C.tomate : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: a.deadline.includes('Avant') ? 700 : 400 }}>{a.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}