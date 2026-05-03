'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import SegmentExplainer from '@/components/ui/SegmentExplainer'

/* ─── palette (matches Utilisateurs page) ─── */
const C = {
  tomate: '#EC1F27',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  piscineLight: '#E6F0FF',
  citron: '#FCD716',
  citronLight: '#FFF9E6',
  spirit: '#FF6B35',
  spiritLight: '#FFF0E6',
  menthe: '#4DB8A8',
  mentheLight: '#E0F2EF',
  pourpre: '#932D99',
  pourpreLight: '#F3E5F5',
  nuit: '#2B1B4D',
  blanc: '#F8F7F2',
  gray900: '#191829',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

const ROLE_CONFIG: Record<string, { label: string; color: string; light: string }> = {
  admin:     { label: 'Admins',      color: C.tomate,  light: C.tomateLight },
  student:   { label: 'Étudiants',   color: C.piscine, light: C.piscineLight },
  exhibitor: { label: 'Exposants',   color: C.spirit,  light: C.spiritLight },
  teacher:   { label: 'Enseignants', color: C.menthe,  light: C.mentheLight },
  parent:    { label: 'Parents',     color: C.pourpre, light: C.pourpreLight },
}

const ORIENTATION_CONFIG = [
  { key: 'exploring',  label: 'Explorateur (0-32)',  color: C.citron,  light: C.citronLight, fg: '#7A6200' },
  { key: 'comparing',  label: 'Comparaison (33-55)', color: C.piscine, light: C.piscineLight, fg: '#003C8F' },
  { key: 'deciding',   label: 'Décision (66-100)',   color: C.tomate,  light: C.tomateLight, fg: '#B0001A' },
  { key: 'unknown',    label: 'Score non calculé',   color: C.gray500, light: C.gray100, fg: '#3D3D3D' },
]

interface UserFromAPI {
  id: string
  role: string
  orientation_score?: number | null
}

export default function AdminSegmentsPage() {
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})
  const [orientationBuckets, setOrientationBuckets] = useState<Record<string, number>>({
    exploring: 0, comparing: 0, deciding: 0, unknown: 0,
  })
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        /* Use the same API route that /admin/utilisateurs uses — it works,
           whereas direct Supabase calls with .is('deleted_at', null) return 0
           due to RLS policies or column issues. */
        const res = await fetch('/api/admin/users?limit=500')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload = await res.json()
        const users: UserFromAPI[] = payload.data ?? []

        if (cancelled) return

        // Count by role
        const rc: Record<string, number> = {}
        users.forEach(u => { rc[u.role] = (rc[u.role] ?? 0) + 1 })
        setRoleCounts(rc)
        setTotalUsers(users.length)

        // Orientation buckets (students only)
        const students = users.filter(u => u.role === 'student')
        setTotalStudents(students.length)
        const buckets = { exploring: 0, comparing: 0, deciding: 0, unknown: 0 }
        students.forEach(s => {
          const score = s.orientation_score
          if (score === null || score === undefined) buckets.unknown += 1
          else if (score <= 32) buckets.exploring += 1
          else if (score <= 65) buckets.comparing += 1
          else buckets.deciding += 1
        })
        setOrientationBuckets(buckets)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.blanc }}>
      {/* Signature stripe */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${C.tomate} 0 16.66%, ${C.piscine} 16.66% 33.33%, ${C.citron} 33.33% 50%, ${C.spirit} 50% 66.66%, ${C.menthe} 66.66% 83.33%, ${C.pourpre} 83.33% 100%)`,
        }}
      />

      <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Editorial header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', position: 'relative', paddingBottom: 8, marginBottom: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: C.gray500,
            }}>
              Administration — Segments
            </span>
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
          </div>

          <h1 style={{
            margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
            color: C.nuit, textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.03em',
          }}>
            Segments
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: C.gray500, maxWidth: 640, lineHeight: 1.5 }}>
            {loading ? 'Chargement…' : (
              <>
                Répartition des <strong style={{ color: C.nuit }}>{totalUsers}</strong> membres
                {totalStudents > 0 && <> dont <strong style={{ color: C.nuit }}>{totalStudents}</strong> étudiants</>}
              </>
            )}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '14px 20px', background: C.tomateLight, color: C.tomate,
            border: `1.5px solid ${C.tomate}`, borderLeft: `6px solid ${C.tomate}`,
            borderRadius: 2, marginBottom: 24, fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <SegmentExplainer />
        {/* ── By Role ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: C.gray500, margin: '0 0 16px', paddingLeft: 4,
          }}>
            Par rôle
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {(['admin', 'student', 'exhibitor', 'teacher', 'parent'] as const).map(role => {
              const cfg = ROLE_CONFIG[role]
              const count = roleCounts[role] ?? 0
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              return (
                <div key={role} style={{
                  background: '#fff', border: `1px solid ${C.gray200}`,
                  borderLeft: `4px solid ${cfg.color}`, padding: '18px 20px', borderRadius: 2,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: cfg.color, marginBottom: 8,
                  }}>
                    {cfg.label}
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 900, color: C.nuit,
                    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
                  }}>
                    {loading ? '…' : count}
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: 12, color: C.gray500, marginBottom: 10 }}>
                      {pct}% du total
                    </div>
                  )}
                  <div style={{
                    height: 4, borderRadius: 2, background: cfg.light,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0, width: `${pct}%`,
                      background: cfg.color, opacity: 0.8,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

          {/* ── Orientation Stage ── */}
          <section>
            <h2 style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: C.gray500, margin: '0 0 16px', paddingLeft: 4,
            }}>
              Stade d&apos;orientation (étudiants)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {ORIENTATION_CONFIG.map(cfg => {
                const count = orientationBuckets[cfg.key] ?? 0
                const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
                return (
                  <a key={cfg.key} href={`/admin/students`} style={{
                    background: '#fff', border: `1px solid ${C.gray200}`,
                    borderLeft: `4px solid ${cfg.color}`, padding: '18px 20px', borderRadius: 2,
                    textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block',
                    transition: 'box-shadow 0.2s',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                      textTransform: 'uppercase', color: cfg.fg, marginBottom: 8,
                    }}>
                      {cfg.label}
                    </div>
                    <div style={{
                      fontSize: 28, fontWeight: 900, color: C.nuit,
                      letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
                    }}>
                      {loading ? '…' : count}
                    </div>
                    {totalStudents > 0 && (
                      <div style={{ fontSize: 12, color: C.gray500, marginBottom: 10 }}>
                        {pct}% des étudiants
                      </div>
                    )}
                    <div style={{
                      height: 4, borderRadius: 2, background: cfg.light,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0, width: `${pct}%`,
                        background: cfg.color, opacity: 0.8,
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: cfg.fg, marginTop: 8, fontWeight: 600 }}>Voir les étudiants →</div>
                  </a>
                )
              })}
            </div>
        </section>
      </div>
    </div>
  )
}