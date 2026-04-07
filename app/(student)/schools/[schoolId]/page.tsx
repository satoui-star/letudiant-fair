'use client'
import { use, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { track } from '@/lib/analytics/track'
import { useToast } from '@/components/ui/Toaster'
import { Skeleton } from '@/components/ui/Skeleton'
import type { SchoolRow, FormationRow } from '@/lib/supabase/types'

export default function SchoolDetailPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = use(params)
  const { toast } = useToast()
  const [school, setSchool] = useState<SchoolRow | null>(null)
  const [formations, setFormations] = useState<FormationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'formations' | 'stats'>('info')

  useEffect(() => {
    track('school_view', { school_id: schoolId, source: 'direct' })
    async function load() {
      const supabase = getSupabase()
      const [schoolRes, formationsRes] = await Promise.all([
        supabase.from('schools').select('*').eq('id', schoolId).single(),
        supabase.from('formations').select('*').eq('school_id', schoolId).order('name'),
      ])
      if (schoolRes.data) setSchool(schoolRes.data)
      setFormations(formationsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [schoolId])

  function toggleBookmark() {
    setBookmarked(b => !b)
    track(bookmarked ? 'unbookmark' : 'bookmark', { school_id: schoolId, source: 'school_detail' })
    toast(bookmarked ? 'Retiré de vos favoris' : '✓ Ajouté à votre dossier', bookmarked ? 'info' : 'success')
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      <Skeleton variant="card" style={{ height: 200, marginBottom: 16 }} />
      <Skeleton className="h-6 w-3/4" style={{ marginBottom: 8 }} />
      <Skeleton className="h-4 w-1/2" style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} variant="kpi" />)}
      </div>
    </div>
  )

  if (!school) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: '1.25rem' }}>😕</p>
      <p style={{ color: '#6B6B6B' }}>Établissement introuvable</p>
      <a href="/schools" style={{ color: '#E3001B', fontWeight: 600 }}>← Retour à la liste</a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 40, fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1A1A1A,#3A3A3A)', padding: '52px 20px 24px', color: '#fff', position: 'relative' }}>
        <a href="/schools" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>← Retour</a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>{school.type}</span>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.2 }}>{school.name}</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.75 }}>📍 {school.city}</p>
          </div>
          <button onClick={toggleBookmark} style={{ background: bookmarked ? '#E3001B' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontSize: 20 }}>
            {bookmarked ? '❤️' : '🤍'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {school.parcoursup && <span style={{ background: '#003C8F', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Parcoursup</span>}
          {school.apprenticeship && <span style={{ background: '#15803d', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Alternance</span>}
          {school.scholarship_allowed && <span style={{ background: '#92400e', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Bourses</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {([['info', 'Infos'], ['formations', 'Formations'], ['stats', 'Statistiques']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '14px 8px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#E3001B' : 'transparent'}`, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#E3001B' : '#6B6B6B', cursor: 'pointer', fontSize: '0.875rem' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 20px' }}>
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {school.description && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 700 }}>Présentation</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#4B4B4B', lineHeight: 1.6 }}>{school.description}</p>
              </div>
            )}
            {school.website && (
              <a href={school.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 20 }}>🌐</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1A1A1A' }}>Site officiel</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#003C8F' }}>{school.website}</p>
                </div>
              </a>
            )}
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>Filières ciblées</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(school.target_fields ?? []).map(f => (
                  <span key={f} style={{ background: '#F5F5F5', borderRadius: 8, padding: '5px 12px', fontSize: '0.8125rem', fontWeight: 500, color: '#4B4B4B' }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formations.length === 0 ? (
              <p style={{ color: '#6B6B6B', textAlign: 'center', padding: 32 }}>Aucune formation renseignée</p>
            ) : formations.map(f => (
              <div key={f.id} style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A' }}>{f.name}</p>
                <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: '#6B6B6B' }}>{f.level} · {f.duration}</p>
                {f.rncp_code && <span style={{ background: '#F5F5F5', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', color: '#6B6B6B' }}>{f.rncp_code}</span>}
                {f.cost !== null && <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#4B4B4B' }}>💰 {f.cost === 0 ? 'Gratuit' : `${f.cost?.toLocaleString('fr-FR')} €/an`}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Bac Général', value: school.nb_accepted_bac_g ?? '—', icon: '📘' },
              { label: 'Bac Techno', value: school.nb_accepted_bac_t ?? '—', icon: '📗' },
              { label: 'Bac Pro', value: school.nb_accepted_bac_p ?? '—', icon: '📙' },
              { label: 'Insertion pro', value: school.rate_professional_insertion ? `${school.rate_professional_insertion}%` : '—', icon: '💼' },
              { label: 'Frais de scolarité', value: school.tuition_fee ? `${school.tuition_fee?.toLocaleString('fr-FR')} €` : '—', icon: '💰' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 24 }}>{stat.icon}</p>
                <p style={{ margin: '0 0 3px', fontSize: '1.0625rem', fontWeight: 800, color: '#E3001B' }}>{stat.value}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
