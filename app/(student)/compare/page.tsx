'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { trackPageView } from '@/lib/analytics/track'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import type { SchoolRow } from '@/lib/supabase/types'

const MAX_COMPARE = 3

export default function ComparePage() {
  const [allSchools, setAllSchools] = useState<SchoolRow[]>([])
  const [selected, setSelected] = useState<SchoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    trackPageView('compare')
    async function load() {
      const { data } = await getSupabase().from('schools').select('*').order('name')
      setAllSchools(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function addSchool(school: SchoolRow) {
    if (selected.length < MAX_COMPARE && !selected.find(s => s.id === school.id)) {
      setSelected(prev => [...prev, school])
    }
    setShowPicker(false)
  }

  function removeSchool(id: string) {
    setSelected(prev => prev.filter(s => s.id !== id))
  }

  const CRITERIA: { key: keyof SchoolRow; label: string; format?: (v: unknown) => string }[] = [
    { key: 'type', label: 'Type' },
    { key: 'city', label: 'Ville' },
    { key: 'tuition_fee', label: 'Frais annuels', format: v => v === null ? '—' : v === 0 ? 'Gratuit' : `${Number(v).toLocaleString('fr-FR')} €` },
    { key: 'nb_accepted_bac_g', label: 'Reçus Bac G', format: v => v !== null ? String(v) : '—' },
    { key: 'nb_accepted_bac_t', label: 'Reçus Bac T', format: v => v !== null ? String(v) : '—' },
    { key: 'nb_accepted_bac_p', label: 'Reçus Bac Pro', format: v => v !== null ? String(v) : '—' },
    { key: 'rate_professional_insertion', label: 'Insertion pro', format: v => v !== null ? `${v}%` : '—' },
    { key: 'parcoursup', label: 'Parcoursup', format: v => v ? '✓ Oui' : '✗ Non' },
    { key: 'apprenticeship', label: 'Alternance', format: v => v ? '✓ Oui' : '✗ Non' },
    { key: 'scholarship_allowed', label: 'Bourses', format: v => v ? '✓ Oui' : '✗ Non' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#E3001B', padding: '52px 20px 20px', color: '#fff' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.375rem', fontWeight: 800 }}>Comparateur</h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', opacity: 0.8 }}>Comparez jusqu&apos;à 3 établissements côte à côte</p>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {/* Selected schools row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {selected.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A1A' }}>{s.name}</span>
              <button onClick={() => removeSchool(s.id)} style={{ background: 'none', border: 'none', color: '#E3001B', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
          {selected.length < MAX_COMPARE && (
            <button onClick={() => setShowPicker(true)} style={{ background: '#fff', border: '2px dashed #E3001B', borderRadius: 12, padding: '8px 16px', color: '#E3001B', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
              + Ajouter
            </button>
          )}
        </div>

        {/* Picker */}
        {showPicker && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.9375rem' }}>Choisir un établissement</p>
            {loading ? <Skeleton className="h-10" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {allSchools.filter(s => !selected.find(sel => sel.id === s.id)).map(s => (
                  <button key={s.id} onClick={() => addSchool(s)} style={{ background: '#F7F7F7', border: 'none', borderRadius: 10, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#1A1A1A' }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{s.city} · {s.type}</p>
                    </div>
                    <span style={{ color: '#E3001B' }}>+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selected.length === 0 ? (
          <EmptyState icon="⚖️" title="Aucun établissement sélectionné" description="Ajoutez jusqu'à 3 établissements pour les comparer côte à côte." action={{ label: 'Ajouter un établissement', onClick: () => setShowPicker(true) }} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${selected.length}, 1fr)`, borderBottom: '2px solid #F0F0F0' }}>
              <div style={{ padding: '12px 14px', background: '#F7F7F7' }} />
              {selected.map(s => (
                <div key={s.id} style={{ padding: '12px 10px', borderLeft: '1px solid #F0F0F0', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8125rem', color: '#1A1A1A', lineHeight: 1.3 }}>{s.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.6875rem', color: '#6B6B6B' }}>{s.city}</p>
                </div>
              ))}
            </div>
            {/* Criteria rows */}
            {CRITERIA.map((criterion, idx) => (
              <div key={criterion.key} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${selected.length}, 1fr)`, borderBottom: idx < CRITERIA.length - 1 ? '1px solid #F5F5F5' : 'none', background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <div style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#6B6B6B', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{criterion.label}</div>
                {selected.map(s => {
                  const val = s[criterion.key]
                  const display = criterion.format ? criterion.format(val) : val != null ? String(val) : '—'
                  return (
                    <div key={s.id} style={{ padding: '12px 10px', borderLeft: '1px solid #F0F0F0', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: display === '✓ Oui' ? '#15803d' : display === '✗ Non' ? '#DC2626' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {display}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <StudentBottomNav />
    </div>
  )
}
