'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

interface SegmentCount {
  label: string
  count: number
  tone: 'red' | 'blue' | 'yellow' | 'gray'
}

export default function AdminSegmentsPage() {
  const [segments, setSegments] = useState<SegmentCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = getSupabase()

        // Role breakdown (all users)
        const roles: Array<'student' | 'teacher' | 'exhibitor' | 'admin' | 'parent'> = [
          'student', 'teacher', 'exhibitor', 'parent', 'admin',
        ]
        const roleCounts = await Promise.all(
          roles.map(async (role) => {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('role', role)
              .is('deleted_at', null)
            return { role, count: count ?? 0 }
          }),
        )

        // Orientation stage breakdown (students only, score buckets)
        const { data: studentsWithScore } = await supabase
          .from('users')
          .select('id, orientation_score')
          .eq('role', 'student')
          .is('deleted_at', null)

        const buckets = { exploring: 0, comparing: 0, deciding: 0, unknown: 0 }
        for (const s of studentsWithScore ?? []) {
          const score = (s as { orientation_score: number | null }).orientation_score
          if (score === null || score === undefined) buckets.unknown += 1
          else if (score <= 40) buckets.exploring += 1
          else if (score <= 65) buckets.comparing += 1
          else buckets.deciding += 1
        }

        if (cancelled) return
        setSegments([
          { label: 'Étudiants', count: roleCounts.find((r) => r.role === 'student')?.count ?? 0, tone: 'blue' },
          { label: 'Enseignants', count: roleCounts.find((r) => r.role === 'teacher')?.count ?? 0, tone: 'gray' },
          { label: 'Exposants', count: roleCounts.find((r) => r.role === 'exhibitor')?.count ?? 0, tone: 'red' },
          { label: 'Parents', count: roleCounts.find((r) => r.role === 'parent')?.count ?? 0, tone: 'yellow' },
          { label: 'Admins', count: roleCounts.find((r) => r.role === 'admin')?.count ?? 0, tone: 'gray' },
        ])

        setOrientationBuckets([
          { label: 'Exploration (0-40)', count: buckets.exploring, tone: 'yellow' },
          { label: 'Comparaison (41-65)', count: buckets.comparing, tone: 'blue' },
          { label: 'Décision (66-100)', count: buckets.deciding, tone: 'red' },
          { label: 'Score non calculé', count: buckets.unknown, tone: 'gray' },
        ])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const [orientationBuckets, setOrientationBuckets] = useState<SegmentCount[]>([])

  const totalUsers = segments.reduce((sum, s) => sum + s.count, 0)

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#6B6B6B', margin: '0 0 6px' }}>
          Administration · Segments
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', color: '#1A1A1A' }}>
          Répartition des utilisateurs
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', margin: 0 }}>
          {loading ? 'Chargement…' : `${totalUsers} utilisateur${totalUsers > 1 ? 's' : ''} actifs`}
        </p>
      </header>

      {error && (
        <div style={{ padding: 12, background: '#FDEAEA', border: '1px solid #E3001B', borderRadius: 6, color: '#B0001A', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>
          Par rôle
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {segments.map((s) => (
            <SegmentCard key={s.label} seg={s} total={totalUsers} />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>
          Stade d&apos;orientation (étudiants)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {orientationBuckets.map((s) => (
            <SegmentCard key={s.label} seg={s} />
          ))}
        </div>
      </section>
    </div>
  )
}

const TONE: Record<SegmentCount['tone'], { bg: string; fg: string }> = {
  red:    { bg: '#FDEAEA', fg: '#B0001A' },
  blue:   { bg: '#E6ECF8', fg: '#003C8F' },
  yellow: { bg: '#FFFBE6', fg: '#7A6200' },
  gray:   { bg: '#F4F4F4', fg: '#3D3D3D' },
}

function SegmentCard({ seg, total }: { seg: SegmentCount; total?: number }) {
  const tone = TONE[seg.tone]
  const pct = total && total > 0 ? Math.round((seg.count / total) * 100) : null
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, padding: '16px 18px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', margin: '0 0 8px' }}>
        {seg.label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', color: tone.fg }}>
        {seg.count}
      </p>
      {pct !== null && (
        <p style={{ fontSize: 12, color: '#6B6B6B', margin: 0 }}>
          {pct}% du total
        </p>
      )}
      <div
        aria-hidden="true"
        style={{
          marginTop: 10,
          height: 4,
          borderRadius: 2,
          background: tone.bg,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {pct !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${pct}%`,
              background: tone.fg,
              opacity: 0.8,
            }}
          />
        )}
      </div>
    </div>
  )
}
