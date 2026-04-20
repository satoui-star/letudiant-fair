'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface StudentRow {
  id: string
  email: string
  name: string | null
  created_at: string
  last_login: string | null
  scan_count?: number
  match_count?: number
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/users?role=student&limit=100')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload = await res.json()
        if (cancelled) return
        setStudents(payload.data ?? [])
        setTotal(payload.total ?? (payload.data?.length ?? 0))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = students.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.email.toLowerCase().includes(q) ||
      (s.name ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#6B6B6B', margin: '0 0 6px' }}>
          Administration · Étudiants
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', color: '#1A1A1A' }}>
          Étudiants inscrits
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', margin: 0 }}>
          {loading ? 'Chargement…' : `${total} étudiant${total > 1 ? 's' : ''} au total`}
        </p>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou email…"
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1.5px solid #E8E8E8',
          borderRadius: 6,
          fontSize: 14,
          marginBottom: 20,
        }}
      />

      {error && (
        <div style={{ padding: 12, background: '#FDEAEA', border: '1px solid #E3001B', borderRadius: 6, color: '#B0001A', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F4F4F4', textAlign: 'left' }}>
              <th style={cellHeader}>Nom</th>
              <th style={cellHeader}>Email</th>
              <th style={cellHeader}>Inscrit le</th>
              <th style={cellHeader}>Dernière connexion</th>
              <th style={cellHeader}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6B6B6B' }}>
                  Aucun étudiant trouvé.
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid #F4F4F4' }}>
                <td style={cell}>{s.name ?? '—'}</td>
                <td style={cell}>{s.email}</td>
                <td style={cell}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                <td style={cell}>
                  {s.last_login ? new Date(s.last_login).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td style={cell}>
                  <Link
                    href={`/admin/students/${s.id}`}
                    style={{ color: '#E3001B', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}
                  >
                    Détails →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const cellHeader: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#6B6B6B',
}
const cell: React.CSSProperties = {
  padding: '14px',
  color: '#1A1A1A',
}
