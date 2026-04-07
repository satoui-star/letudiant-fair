'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toaster'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import ExhibitorSideNav from '@/components/layouts/ExhibitorSideNav'
import type { LeadRow } from '@/lib/supabase/types'

type LeadWithUser = LeadRow & { users: { name: string; email: string; education_level: string; postal_code: string | null } | null }

const TIER_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  deciding:   { bg: '#DCFCE7', color: '#15803d', label: '🟢 Décideur' },
  comparing:  { bg: '#FEF9C3', color: '#92400e', label: '🟡 Comparateur' },
  exploring:  { bg: '#EFF6FF', color: '#1d4ed8', label: '🔵 Explorateur' },
}

export default function ExhibitorLeadsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [leads, setLeads] = useState<LeadWithUser[]>([])
  const [filtered, setFiltered] = useState<LeadWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<LeadWithUser | null>(null)
  const [exporting, setExporting] = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      // Find school linked to this exhibitor user
      const { data: userData } = await supabase
        .from('users').select('id').eq('id', profile?.id ?? '').single()

      // For MVP: fetch leads where exported_by matches or just get all leads for first school
      const { data: schoolData } = await supabase.from('schools').select('id').limit(1).single()
      const sid = schoolData?.id ?? null
      setSchoolId(sid)

      if (!sid) { setLoading(false); return }

      const { data } = await supabase
        .from('leads')
        .select('*, users(name, email, education_level, postal_code)')
        .eq('school_id', sid)
        .order('score_value', { ascending: false })

      const rows = (data ?? []) as LeadWithUser[]
      setLeads(rows)
      setFiltered(rows)
      setLoading(false)
    }
    load()
  }, [profile])

  useEffect(() => {
    setFiltered(tierFilter === 'all' ? leads : leads.filter(l => l.score_tier === tierFilter))
  }, [tierFilter, leads])

  async function exportCSV() {
    if (!schoolId) return
    setExporting(true)
    try {
      const url = `/api/leads/export-csv?schoolId=${schoolId}&tier=${tierFilter !== 'all' ? tierFilter : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `leads_letudiant_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      toast('✓ Export CSV téléchargé', 'success')
    } catch {
      toast('Erreur lors de l\'export', 'error')
    } finally {
      setExporting(false)
    }
  }

  const deciding = leads.filter(l => l.score_tier === 'deciding').length
  const comparing = leads.filter(l => l.score_tier === 'comparing').length
  const exploring = leads.filter(l => l.score_tier === 'exploring').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      <ExhibitorSideNav />
      <main style={{ flex: 1, padding: '32px 28px', marginLeft: 220 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>Mes Leads</h1>
            <p style={{ margin: 0, color: '#6B6B6B', fontSize: '0.9rem' }}>{leads.length} contacts qualifiés</p>
          </div>
          <button onClick={exportCSV} disabled={exporting || leads.length === 0} style={{ background: '#E3001B', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: leads.length === 0 ? 0.5 : 1 }}>
            {exporting ? 'Export…' : '⬇ Exporter CSV'}
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Décideurs', value: deciding, color: '#15803d', bg: '#DCFCE7' },
            { label: 'Comparateurs', value: comparing, color: '#92400e', bg: '#FEF9C3' },
            { label: 'Explorateurs', value: exploring, color: '#1d4ed8', bg: '#EFF6FF' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: k.color }}>{loading ? '—' : k.value}</div>
              <div style={{ fontSize: '0.8125rem', color: '#6B6B6B', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[['all', 'Tous'], ['deciding', '🟢 Décideurs'], ['comparing', '🟡 Comparateurs'], ['exploring', '🔵 Explorateurs']].map(([val, label]) => (
            <button key={val} onClick={() => setTierFilter(val)} style={{ background: tierFilter === val ? '#1A1A1A' : '#fff', color: tierFilter === val ? '#fff' : '#4B4B4B', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Leads table */}
        {loading ? <SkeletonTable rows={6} /> : filtered.length === 0 ? (
          <EmptyState icon="📭" title="Aucun lead pour le moment" description="Les contacts qualifiés de votre stand apparaîtront ici après le salon." />
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F7F7F7' }}>
                  {['Nom', 'Niveau', 'Code postal', 'Score', 'Segment', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const tier = TIER_COLORS[lead.score_tier]
                  return (
                    <tr key={lead.id} style={{ borderTop: '1px solid #F5F5F5', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', color: '#1A1A1A' }}>{lead.users?.name ?? '—'}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{lead.users?.email ?? ''}</p>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#4B4B4B' }}>{lead.users?.education_level ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#4B4B4B' }}>{lead.users?.postal_code ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#F0F0F0', borderRadius: 3, maxWidth: 60 }}>
                            <div style={{ width: `${lead.score_value}%`, height: '100%', background: tier.color, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: tier.color }}>{lead.score_value}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: tier.bg, color: tier.color, borderRadius: 8, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{tier.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setSelectedLead(lead)} style={{ background: '#F5F5F5', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', color: '#1A1A1A' }}>
                          Détail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Lead detail modal */}
        <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.users?.name ?? 'Détail lead'}>
          {selectedLead && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Score', value: `${selectedLead.score_value}/100` },
                  { label: 'Segment', value: TIER_COLORS[selectedLead.score_tier].label },
                  { label: 'Niveau', value: selectedLead.users?.education_level ?? '—' },
                  { label: 'Code postal', value: selectedLead.users?.postal_code ?? '—' },
                  { label: 'Stands visités', value: selectedLead.stands_visited?.length ?? 0 },
                  { label: 'Temps sur le salon', value: `${selectedLead.dwell_minutes ?? 0} min` },
                ].map(item => (
                  <div key={item.label} style={{ background: '#F7F7F7', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: '0.75rem', color: '#6B6B6B' }}>{item.label}</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F7F7F7', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#6B6B6B' }}>Filières déclarées</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(selectedLead.education_branches ?? []).map(f => (
                    <span key={f} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 6, padding: '3px 10px', fontSize: '0.8125rem' }}>{f}</span>
                  ))}
                </div>
              </div>
              <a href={`mailto:${selectedLead.users?.email}`} style={{ display: 'block', textAlign: 'center', background: '#E3001B', color: '#fff', borderRadius: 12, padding: '13px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>
                ✉ Contacter par email
              </a>
            </div>
          )}
        </Modal>
      </main>
    </div>
  )
}
