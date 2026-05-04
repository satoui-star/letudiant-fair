'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import SectionLabel from '@/components/ui/SectionLabel'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import Icon, { type IconName } from '@/components/ui/Icon'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalScans:     number
  todayScans:     number
  swipeRights:    number
  appointments:   number
  decidingPct:    number
  comparingPct:   number
  exploringPct:   number
  topBranches:    { label: string; pct: number }[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = '#EC1F27' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="le-kpi-card" style={{ padding: '20px 22px', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
        borderRadius: '3px 0 0 3px',
      }} />
      <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color: '#191829', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: '#9B9B9B' }}>{sub}</p>}
    </div>
  )
}

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#3D3D3D' }}>{label}</span>
        <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'rgba(16,24,40,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)`,
          borderRadius: 999,
          transition: 'width 0.6s var(--ease-out)',
        }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExhibitorDashboard() {
  const { user, profile } = useAuth()

  const [schoolId,  setSchoolId]  = useState<string | null>(null)
  const [schoolName,setSchoolName]= useState('Mon établissement')
  const [stats,     setStats]     = useState<DashboardStats | null>(null)
  const [eventName, setEventName] = useState('Salon en cours')
  const [loading,   setLoading]   = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()

      // Find exhibitor's school
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, name')
        .eq('user_id', user!.id)
        .maybeSingle()

      const sId   = schoolData?.id   ?? null
      const sName = schoolData?.name ?? profile?.name ?? 'Mon établissement'
      setSchoolId(sId)
      setSchoolName(sName)

      // Next / ongoing event
      const { data: eventData } = await supabase
        .from('events')
        .select('id, name, event_date')
        .gte('event_date', new Date().toISOString().slice(0, 10))
        .order('event_date')
        .limit(1)
        .maybeSingle()

      if (eventData) setEventName(`${eventData.name} — ${new Date(eventData.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`)

      if (!sId) { setLoading(false); return }

      // ── Aggregate scans for this school ──────────────────────────────────────
      // Students who scanned the school stand QR
      const today = new Date().toISOString().slice(0, 10)
      const [scansRes, todayScansRes, swipesRes, apptRes] = await Promise.all([
        supabase.from('scans').select('id', { count: 'exact', head: true })
          .eq('school_id', sId).eq('channel', 'stand'),
        supabase.from('scans').select('id', { count: 'exact', head: true })
          .eq('school_id', sId).eq('channel', 'stand').gte('created_at', today),
        supabase.from('matches').select('id', { count: 'exact', head: true })
          .eq('school_id', sId).eq('student_swipe', 'right'),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('school_id', sId).neq('status', 'cancelled'),
      ])

      const total    = scansRes.count    ?? 0
      const todayCt  = todayScansRes.count ?? 0
      const swipes   = swipesRes.count   ?? 0
      const appts    = apptRes.count     ?? 0
      setScanCount(total)

      // ── Intent distribution (aggregate % only) ────────────────────────────
      // Join scans → users → intent_level, count per level
      const { data: intentRows } = await supabase
        .from('scans')
        .select('users!inner(intent_level)')
        .eq('school_id', sId)
        .eq('channel', 'stand')

      const intentCounts = { low: 0, medium: 0, high: 0 }
      ;(intentRows ?? []).forEach((row: any) => {
        const lvl = row.users?.intent_level ?? 'low'
        if (lvl in intentCounts) intentCounts[lvl as keyof typeof intentCounts]++
      })
      const intentTotal = intentCounts.low + intentCounts.medium + intentCounts.high || 1

      // ── Top interest branches (aggregate) ─────────────────────────────────
      const { data: branchRows } = await supabase
        .from('scans')
        .select('users!inner(education_branches)')
        .eq('school_id', sId)
        .eq('channel', 'stand')

      const branchMap: Record<string, number> = {}
      ;(branchRows ?? []).forEach((row: any) => {
        const branches: string[] = row.users?.education_branches ?? []
        branches.forEach((b: string) => { branchMap[b] = (branchMap[b] ?? 0) + 1 })
      })
      const branchTotal = Object.values(branchMap).reduce((a, b) => a + b, 1)
      const topBranches = Object.entries(branchMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, count]) => ({ label, pct: Math.round((count / branchTotal) * 100) }))

      setStats({
        totalScans:   total,
        todayScans:   todayCt,
        swipeRights:  swipes,
        appointments: appts,
        decidingPct:  Math.round((intentCounts.high   / intentTotal) * 100),
        comparingPct: Math.round((intentCounts.medium / intentTotal) * 100),
        exploringPct: Math.round((intentCounts.low    / intentTotal) * 100),
        topBranches,
      })

      setLoading(false)
    }
    load()
  }, [user, profile])

  // ── Fetch stand QR from DB once schoolId is known ────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    setQrLoading(true)
    fetch('/api/exhibitor/qr')
      .then(r => r.json())
      .then(json => { if (json.qr) setQrDataUrl(json.qr) })
      .catch(console.error)
      .finally(() => setQrLoading(false))
  }, [schoolId])

  // ── Download stand QR ────────────────────────────────────────────────────────
  function downloadQR() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qr-stand-${schoolName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = qrDataUrl
    link.click()
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="le-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(236,31,39,0.08)', color: '#EC1F27', marginBottom: 16, fontSize: '0.875rem', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EC1F27', animation: 'lePulseDot 1.8s var(--ease-smooth) infinite' }} />
          Gestion des salons · 2026
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 8px', color: '#1A1A1A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {loading ? '…' : schoolName}
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: '1rem', color: '#6B6B6B', lineHeight: 1.5 }}>
          Analysez l'engagement des visiteurs au salon
        </p>

        {/* Feature pill — Rendez-vous only */}
        <div>
          <Link
            href="/exhibitor/appointments"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <div className="le-feature-pill" style={{ padding: '10px 18px' }}>
              <Icon name={'calendar' as IconName} size={16} style={{ color: '#EC1F27' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1A1A' }}>Rendez-vous</span>
              <span style={{ fontSize: '0.75rem', color: '#EC1F27', fontWeight: 700 }}>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── GDPR policy notice ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF6D5 100%)',
        border: '1px solid rgba(252, 215, 22, 0.45)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px', marginBottom: 24,
        display: 'flex', gap: 10, alignItems: 'flex-start',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <Icon name="lock" size={18} style={{ flexShrink: 0, color: '#92400e' }} />
        <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
          <strong>Données 100 % agrégées.</strong> Conformément au RGPD, les profils individuels des visiteurs appartiennent à L&apos;Étudiant et ne sont pas accessibles ici.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} variant="kpi" />)}
          </div>
          <Skeleton height={240} borderRadius={14} />
        </div>
      ) : !stats || stats.totalScans === 0 ? (
        <div className="le-card le-card-padded" style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'linear-gradient(135deg, #FFF8F8 0%, #FFFFFF 100%)',
          border: '1px solid rgba(236,31,39,0.18)',
        }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EC1F27 0%, #C41520 100%)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(236,31,39,0.24)',
          }}><Icon name="scan" size={32} strokeWidth={1.75} /></div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#1A1A1A' }}>
            Aucun scan pour le moment
          </h2>
          <p style={{ margin: '0 auto 24px', fontSize: 14, color: '#6B6B6B', maxWidth: 420, lineHeight: 1.5 }}>
            Affichez votre QR code à votre stand pour commencer à collecter des visiteurs.
            Les statistiques apparaîtront ici dès le premier scan.
          </p>
          {schoolId && (
            <>
              <div style={{
                display: 'inline-block', padding: 14, marginBottom: 16,
                background: '#fff', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16,24,40,0.08)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR stand" style={{ display: 'block', width: 180, height: 180, borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 180, height: 180, borderRadius: 6, background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9CA3AF', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 32 }}>📱</span>
                    {qrLoading ? 'Chargement…' : 'QR non généré'}
                  </div>
                )}
              </div>
              <div>
                {qrDataUrl ? (
                  <Button variant="primary" size="sm" onClick={downloadQR}>
                    <Icon name="download" size={14} style={{ marginRight: 6 }} /> Télécharger le QR à imprimer
                  </Button>
                ) : (
                  <Link href="/exhibitor/leads" style={{ fontSize: '0.8125rem', color: '#EC1F27', fontWeight: 700, textDecoration: 'none' }}>
                    Générer mon QR →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* ── KPI row ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
            <KpiCard label="Scans au stand" value={stats?.totalScans ?? 0} sub="total salon" color="#EC1F27" />
            <KpiCard label="Scans aujourd'hui" value={stats?.todayScans ?? 0} sub="journée en cours" color="#0066CC" />
            <KpiCard label="Intérêts confirmés" value={stats?.swipeRights ?? 0} sub="swipes droite dans l'app" color="#15803d" />
            <Link href="/exhibitor/appointments" style={{ textDecoration: 'none' }}>
              <KpiCard label="Rendez-vous" value={stats?.appointments ?? 0} sub="confirmés — voir →" color="#7C3AED" />
            </Link>
          </div>

          {/* ── Charts + Stand QR (2-column) ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 28, alignItems: 'start' }}>

            {/* Left: funnel + interests */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Entonnoir d'engagement */}
              <div className="le-card le-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SectionLabel>Entonnoir d&apos;engagement</SectionLabel>
                {[
                  { label: 'Scan stand',        count: stats?.totalScans   ?? 0, color: '#EC1F27' },
                  { label: 'Swipe app',          count: stats?.swipeRights  ?? 0, color: '#0066CC' },
                  { label: 'Rendez-vous pris',   count: stats?.appointments ?? 0, color: '#FCD716' },
                ].map(f => {
                  const max = stats?.totalScans || 1
                  const pct = Math.round((f.count / max) * 100)
                  return (
                    <div key={f.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#3D3D3D' }}>{f.label}</span>
                        <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 600 }}>{f.count}</span>
                      </div>
                      <div style={{ height: 10, background: '#E8E8E8', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: f.color, borderRadius: 5, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Niveau d'intention (aggregate %) */}
              <div className="le-card le-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SectionLabel>Niveau d&apos;intention des visiteurs</SectionLabel>
                <BarRow label="● Décideur"    pct={stats?.decidingPct  ?? 0} color="#EC1F27" />
                <BarRow label="● Comparateur" pct={stats?.comparingPct ?? 0} color="#FCD716" />
                <BarRow label="● Explorateur" pct={stats?.exploringPct ?? 0} color="#0066CC" />
                <p style={{ margin: 0, fontSize: 12, color: '#9B9B9B', lineHeight: 1.4 }}>
                  Calculé sur les signaux comportementaux agrégés — aucune donnée individuelle.
                </p>
              </div>

              {/* Top domaines d'intérêt */}
              {stats && stats.topBranches.length > 0 && (
                <div className="le-card le-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <SectionLabel>Domaines d&apos;intérêt des visiteurs</SectionLabel>
                  {stats.topBranches.map(b => (
                    <BarRow key={b.label} label={b.label} pct={b.pct} color="#0066CC" />
                  ))}
                </div>
              )}
            </div>

            {/* Right: school stand QR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

              <div className="le-card le-card-padded" style={{ textAlign: 'center' }}>
                <SectionLabel style={{ marginBottom: 12 }}>QR Code de votre stand</SectionLabel>

                <div style={{
                  display: 'inline-block', padding: 14,
                  background: '#fff', borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(16,24,40,0.08)',
                  marginBottom: 12, boxShadow: 'var(--shadow-sm)',
                }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR stand" style={{ display: 'block', width: 180, height: 180, borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 180, height: 180, borderRadius: 6, background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9CA3AF', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 32 }}>📱</span>
                      {qrLoading ? 'Chargement…' : 'QR non généré'}
                    </div>
                  )}
                </div>

                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#1A1A1A' }}>
                  {schoolName}
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: '#6B6B6B', lineHeight: 1.4 }}>
                  Affichez ce QR à votre stand. Les étudiants le scannent depuis l&apos;app pour enregistrer leur visite.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {qrDataUrl ? (
                    <Button variant="primary" size="sm" onClick={downloadQR} style={{ width: '100%' }}>
                      <Icon name="download" size={14} style={{ marginRight: 6 }} /> Télécharger pour impression
                    </Button>
                  ) : (
                    <Link href="/exhibitor/leads" style={{ display: 'block', textAlign: 'center', fontSize: '0.8125rem', color: '#fff', background: '#16A34A', borderRadius: 8, padding: '10px 0', fontWeight: 700, textDecoration: 'none' }}>
                      ✨ Générer mon QR →
                    </Link>
                  )}
                  <Link href="/exhibitor/leads" style={{ display: 'block', textAlign: 'center', fontSize: '0.8125rem', color: '#EC1F27', fontWeight: 600, textDecoration: 'none', padding: '8px 0' }}>
                    Voir les statistiques détaillées →
                  </Link>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#F4F4F4', borderRadius: 8, padding: '8px 12px', justifyContent: 'center' }}>
                  <Icon name="scan" size={16} style={{ color: '#3D3D3D' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3D3D3D' }}>
                    {scanCount} scan{scanCount !== 1 ? 's' : ''} enregistré{scanCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
