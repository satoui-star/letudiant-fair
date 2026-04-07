'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import AdminSideNav from '@/components/layouts/AdminSideNav'
import type { EventRow } from '@/lib/supabase/types'

type Tab = 'avant' | 'pendant' | 'apres'

interface Stats {
  totalRegistered: number
  totalScanned: number
  noShowCount: number
  totalLeads: number
  decidingLeads: number
  totalGroups: number
  groupMembers: number
  topStands: { name: string; city: string; scans: number }[]
  filiereBreakdown: { name: string; count: number }[]
  scoreTiers: { exploring: number; comparing: number; deciding: number }
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('avant')
  const [events, setEvents] = useState<EventRow[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: eventsData } = await supabase.from('events').select('*').order('event_date', { ascending: true })
      const eventList = eventsData ?? []
      setEvents(eventList)
      if (eventList.length > 0) {
        setSelectedEvent(eventList[0])
        await loadStats(eventList[0].id)
      } else {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadStats(eventId: string) {
    setLoading(true)
    const supabase = getSupabase()

    const [usersRes, scansRes, leadsRes, groupsRes, schoolsRes] = await Promise.all([
      supabase.from('users').select('id, education_branches, orientation_stage').eq('role', 'student'),
      supabase.from('scans').select('id, channel, stand_id, dwell_estimate').eq('event_id', eventId),
      supabase.from('leads').select('id, score_tier, education_branches').eq('event_id', eventId),
      supabase.from('groups').select('id, member_uids').eq('fair_id', eventId),
      supabase.from('stands').select('id, school_id, schools(name, city)').eq('event_id', eventId),
    ])

    const users = usersRes.data ?? []
    const scans = scansRes.data ?? []
    const leads = leadsRes.data ?? []
    const groups = groupsRes.data ?? []
    const stands = schoolsRes.data ?? []

    const entryScans = scans.filter(s => s.channel === 'entry')
    const standScans = scans.filter(s => s.channel === 'stand')

    // Build stand scan counts
    const standScanMap: Record<string, number> = {}
    standScans.forEach(s => { if (s.stand_id) standScanMap[s.stand_id] = (standScanMap[s.stand_id] ?? 0) + 1 })
    const topStands = stands
      .map(st => ({ name: (st.schools as { name: string; city: string } | null)?.name ?? 'Stand', city: (st.schools as { name: string; city: string } | null)?.city ?? '', scans: standScanMap[st.id] ?? 0 }))
      .sort((a, b) => b.scans - a.scans).slice(0, 6)

    // Filière breakdown from leads
    const filiereMap: Record<string, number> = {}
    leads.forEach(l => { (l.education_branches ?? []).forEach((f: string) => { filiereMap[f] = (filiereMap[f] ?? 0) + 1 }) })
    const filiereBreakdown = Object.entries(filiereMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)

    const scoreTiers = {
      exploring: leads.filter(l => l.score_tier === 'exploring').length,
      comparing: leads.filter(l => l.score_tier === 'comparing').length,
      deciding: leads.filter(l => l.score_tier === 'deciding').length,
    }

    setStats({
      totalRegistered: users.length,
      totalScanned: entryScans.length,
      noShowCount: Math.max(0, users.length - entryScans.length),
      totalLeads: leads.length,
      decidingLeads: scoreTiers.deciding,
      totalGroups: groups.length,
      groupMembers: groups.reduce((sum, g) => sum + (g.member_uids?.length ?? 0), 0),
      topStands,
      filiereBreakdown,
      scoreTiers,
    })
    setLoading(false)
  }

  const kpi = (label: string, value: number | string, sub?: string, color = '#E3001B') => (
    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      {loading ? <Skeleton className="h-8 w-20" style={{ margin: '4px 0' }} /> : (
        <p style={{ margin: '0 0 3px', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</p>
      )}
      {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      <AdminSideNav />
      <main style={{ flex: 1, padding: '32px 28px', marginLeft: 220 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>Tableau de bord</h1>
            <p style={{ margin: 0, color: '#6B6B6B', fontSize: '0.9rem' }}>Pilotage temps réel · L&apos;Étudiant Salons</p>
          </div>
          {events.length > 0 && (
            <select value={selectedEvent?.id ?? ''} onChange={async e => {
              const ev = events.find(ev => ev.id === e.target.value)
              if (ev) { setSelectedEvent(ev); await loadStats(ev.id) }
            }} style={{ border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 14px', fontSize: '0.875rem', background: '#fff', color: '#1A1A1A', fontWeight: 600 }}>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {new Date(ev.event_date).toLocaleDateString('fr-FR')}</option>)}
            </select>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {([['avant', '📋 Avant'], ['pendant', '🔴 Pendant'], ['apres', '📊 Après']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#E3001B' : 'transparent', color: tab === t ? '#fff' : '#6B6B6B', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ─── AVANT ─── */}
        {tab === 'avant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {kpi('Inscrits', stats?.totalRegistered ?? 0)}
              {kpi('Groupes enseignants', stats?.totalGroups ?? 0, undefined, '#003C8F')}
              {kpi('Élèves en groupe', stats?.groupMembers ?? 0, undefined, '#003C8F')}
              {kpi('Établissements au salon', events.length > 0 ? '—' : 0, undefined, '#6B6B6B')}
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Filières les plus demandées</h3>
              {loading ? <SkeletonList count={5} variant="line" /> : stats?.filiereBreakdown.length === 0 ? (
                <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>Données disponibles après inscription des participants</p>
              ) : stats?.filiereBreakdown.map(f => {
                const max = stats.filiereBreakdown[0].count
                return (
                  <div key={f.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>{f.name}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E3001B' }}>{f.count}</span>
                    </div>
                    <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3 }}>
                      <div style={{ width: `${(f.count / max) * 100}%`, height: '100%', background: '#E3001B', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── PENDANT ─── */}
        {tab === 'pendant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {kpi('Présents', stats?.totalScanned ?? 0, undefined, '#22c55e')}
              {kpi('Non-présents', stats?.noShowCount ?? 0, 'inscrits non scannés', '#f59e0b')}
              {kpi('Leads générés', stats?.totalLeads ?? 0)}
              {kpi('Décideurs', stats?.decidingLeads ?? 0, undefined, '#22c55e')}
            </div>

            {/* No-show alert */}
            {!loading && stats && stats.noShowCount > 0 && (
              <div style={{ background: '#FFF7E0', border: '1px solid #f59e0b', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e' }}>Alerte no-show</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}><strong>{stats.noShowCount.toLocaleString('fr-FR')} inscrits</strong> ne se sont pas encore présentés. Envoyez un rappel push pour augmenter la présence.</p>
                </div>
              </div>
            )}

            {/* Top stands heatmap */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Stands les plus visités</h3>
              {loading ? <SkeletonList count={6} variant="line" /> : stats?.topStands.length === 0 ? (
                <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>Les données de stands apparaîtront en temps réel pendant le salon</p>
              ) : stats?.topStands.map((stand, i) => {
                const max = stats.topStands[0].scans || 1
                return (
                  <div key={stand.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ width: 22, height: 22, background: i < 3 ? '#E3001B' : '#F0F0F0', color: i < 3 ? '#fff' : '#6B6B6B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1A1A' }}>{stand.name}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E3001B' }}>{stand.scans} scans</span>
                      </div>
                      <div style={{ height: 5, background: '#F0F0F0', borderRadius: 3 }}>
                        <div style={{ width: `${(stand.scans / max) * 100}%`, height: '100%', background: i < 3 ? '#E3001B' : '#6B6B6B', borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── APRÈS ─── */}
        {tab === 'apres' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {kpi('Total leads', stats?.totalLeads ?? 0)}
              {kpi('Décideurs (SC3)', stats?.decidingLeads ?? 0, `${stats ? Math.round((stats.decidingLeads / Math.max(stats.totalLeads, 1)) * 100) : 0}% du total`, '#22c55e')}
              {kpi('Taux de conversion', stats && stats.totalScanned > 0 ? `${Math.round((stats.totalLeads / stats.totalScanned) * 100)}%` : '—')}
            </div>

            {/* Score tier breakdown */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Répartition par segment</h3>
              {loading ? <SkeletonList count={3} variant="kpi" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Décideurs (66–100)', count: stats?.scoreTiers.deciding ?? 0, color: '#22c55e', bg: '#DCFCE7' },
                    { label: 'Comparateurs (41–65)', count: stats?.scoreTiers.comparing ?? 0, color: '#92400e', bg: '#FEF9C3' },
                    { label: 'Explorateurs (0–40)', count: stats?.scoreTiers.exploring ?? 0, color: '#1d4ed8', bg: '#EFF6FF' },
                  ].map(tier => {
                    const total = (stats?.totalLeads ?? 0) || 1
                    return (
                      <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: tier.bg, borderRadius: 12, padding: '12px 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: tier.color }}>{tier.label}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: tier.color }}>{tier.count} leads</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3 }}>
                            <div style={{ width: `${(tier.count / total) * 100}%`, height: '100%', background: tier.color, borderRadius: 3 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '1.125rem', fontWeight: 800, color: tier.color, minWidth: 40, textAlign: 'right' }}>{Math.round((tier.count / total) * 100)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
