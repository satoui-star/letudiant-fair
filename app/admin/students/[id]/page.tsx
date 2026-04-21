'use client'
export const dynamic = 'force-dynamic'

import { use, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface StudentProfile {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  last_login: string | null
  deleted_at: string | null
  orientation_score?: number | null
  interests?: string[] | null
}

interface ScanRow { id: string; event_id: string; stand_id: string; channel: string; created_at: string }
interface MatchRow { id: string; school_id: string; student_swipe: string | null; created_at: string }
interface SavedItemRow { id: string; kind: string; label: string; created_at: string }

export default function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [scans, setScans] = useState<ScanRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [saved, setSaved] = useState<SavedItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = getSupabase()
        const [userRes, scansRes, matchesRes, savedRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', id).maybeSingle(),
          supabase.from('scans').select('id, event_id, stand_id, channel, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
          supabase.from('matches').select('id, school_id, student_swipe, created_at').eq('student_id', id).order('created_at', { ascending: false }).limit(50),
          supabase.from('saved_items').select('id, kind, label, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
        ])
        if (cancelled) return
        if (userRes.error) throw userRes.error
        setStudent(userRes.data as StudentProfile)
        setScans(scansRes.data ?? [])
        setMatches(matchesRes.data ?? [])
        setSaved(savedRes.data ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B6B6B' }}>Chargement…</div>
  if (error || !student) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#B0001A', fontWeight: 600 }}>{error ?? 'Étudiant introuvable'}</p>
      <Link href="/admin/students" style={{ color: '#E3001B', fontWeight: 600 }}>← Retour</Link>
    </div>
  )

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/admin/students" style={{ fontSize: 13, color: '#6B6B6B', textDecoration: 'none' }}>← Étudiants</Link>

      <header style={{ marginTop: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: '#1A1A1A' }}>
          {student.name ?? student.email}
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', margin: 0 }}>
          {student.email} · Inscrit le {new Date(student.created_at).toLocaleDateString('fr-FR')}
        </p>
      </header>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <KPI label="Scans" value={scans.length} />
        <KPI label="Swipes" value={matches.length} />
        <KPI label="Sauvegardés" value={saved.length} />
        <KPI label="Score orientation" value={student.orientation_score ?? '—'} />
      </div>

      {/* Interests */}
      {student.interests && student.interests.length > 0 && (
        <section style={section}>
          <h2 style={sectionTitle}>Centres d&apos;intérêt</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {student.interests.map((i) => (
              <span key={i} style={{ background: '#E6ECF8', color: '#003C8F', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                {i}
              </span>
            ))}
          </div>
        </section>
      )}

      <section style={section}>
        <h2 style={sectionTitle}>Derniers scans ({scans.length})</h2>
        {scans.length === 0 ? <p style={empty}>Aucun scan.</p> : (
          <ul style={list}>
            {scans.slice(0, 10).map((s) => (
              <li key={s.id} style={listRow}>
                <span style={{ fontWeight: 600 }}>{s.channel}</span>
                <span style={{ color: '#6B6B6B', fontSize: 12 }}>
                  {new Date(s.created_at).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Swipes récents ({matches.length})</h2>
        {matches.length === 0 ? <p style={empty}>Aucun swipe.</p> : (
          <ul style={list}>
            {matches.slice(0, 10).map((m) => (
              <li key={m.id} style={listRow}>
                <span>{m.school_id}</span>
                <span style={{ color: m.student_swipe === 'right' ? '#15803d' : '#B0001A', fontWeight: 600, fontSize: 12 }}>
                  {m.student_swipe === 'right' ? '→ Intéressé' : '← Passé'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Éléments sauvegardés ({saved.length})</h2>
        {saved.length === 0 ? <p style={empty}>Rien de sauvegardé.</p> : (
          <ul style={list}>
            {saved.slice(0, 10).map((it) => (
              <li key={it.id} style={listRow}>
                <span>[{it.kind}] {it.label}</span>
                <span style={{ color: '#6B6B6B', fontSize: 12 }}>
                  {new Date(it.created_at).toLocaleDateString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, padding: '16px 14px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B6B6B', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>{value}</p>
    </div>
  )
}

const section: React.CSSProperties = { marginBottom: 24 }
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: '#1A1A1A' }
const empty: React.CSSProperties = { fontSize: 13, color: '#6B6B6B' }
const list: React.CSSProperties = { listStyle: 'none', padding: 0, margin: 0, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8 }
const listRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid #F4F4F4', fontSize: 13 }
