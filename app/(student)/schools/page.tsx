'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { trackPageView, track } from '@/lib/analytics/track'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import type { SchoolRow } from '@/lib/supabase/types'

const SCHOOL_TYPES = ['Tous', 'Université', 'Grande École', 'École d\'Ingénieurs', 'École Spécialisée', 'IUT']

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [filtered, setFiltered] = useState<SchoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('Tous')

  useEffect(() => {
    trackPageView('schools_list')
    async function load() {
      const { data } = await getSupabase().from('schools').select('*').order('name')
      setSchools(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = schools
    if (search) result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
    if (activeType !== 'Tous') result = result.filter(s => s.type === activeType)
    setFiltered(result)
    if (search) track('search', { query: search, result_count: result.length, context: 'schools' })
  }, [search, activeType, schools])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#E3001B', padding: '52px 20px 20px', color: '#fff' }}>
        <h1 style={{ margin: '0 0 14px', fontSize: '1.375rem', fontWeight: 800 }}>Établissements</h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un établissement ou une ville…"
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: '0.9375rem', outline: 'none' }}
        />
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SCHOOL_TYPES.map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{ flexShrink: 0, background: activeType === t ? '#E3001B' : '#fff', color: activeType === t ? '#fff' : '#4B4B4B', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', margin: '0 0 14px' }}>{filtered.length} établissement{filtered.length !== 1 ? 's' : ''}</p>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} variant="card" style={{ height: 90 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="Aucun résultat" description={`Aucun établissement ne correspond à "${search || activeType}"`} action={{ label: 'Réinitialiser', onClick: () => { setSearch(''); setActiveType('Tous') } }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(school => (
              <a key={school.id} href={`/schools/${school.id}`} onClick={() => track('school_view', { school_id: school.id, source: 'schools_list' })} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#F0F0F0,#E0E0E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school.name}</p>
                  <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: '#6B6B6B' }}>{school.city} · {school.type}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {school.parcoursup && <span style={{ background: '#EEF2FF', color: '#003C8F', borderRadius: 6, padding: '2px 7px', fontSize: '0.6875rem', fontWeight: 600 }}>Parcoursup</span>}
                    {school.apprenticeship && <span style={{ background: '#F0FDF4', color: '#15803d', borderRadius: 6, padding: '2px 7px', fontSize: '0.6875rem', fontWeight: 600 }}>Alternance</span>}
                    {school.scholarship_allowed && <span style={{ background: '#FFFBEB', color: '#92400e', borderRadius: 6, padding: '2px 7px', fontSize: '0.6875rem', fontWeight: 600 }}>Bourse</span>}
                  </div>
                </div>
                <span style={{ color: '#C0C0C0', fontSize: 20, flexShrink: 0 }}>›</span>
              </a>
            ))}
          </div>
        )}
      </div>
      <StudentBottomNav />
    </div>
  )
}
