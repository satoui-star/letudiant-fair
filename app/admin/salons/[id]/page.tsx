'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { EventRow } from '@/lib/supabase/types'

const C = {
  tomate: '#EC1F27', tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  nuit: '#2B1B4D', noir: '#191829',
  gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4', blanc: '#F8F7F2',
  green: '#15803d',
}

interface ExhibitorRegistration {
  id: string
  event_id: string
  school_id: string
  school_name: string
  registered_at: string
}

interface StudentRegistration {
  id: string
  event_id: string
  user_id: string
  user_name: string
  registered_at: string
  scanned_entry: boolean
  scanned_exit: boolean
  entry_qr: string | null
  exit_qr: string | null
}

export default function SalonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [salon, setSalon] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ name: '', city: '', event_date: '', is_active: false })
  const [tab, setTab] = useState<'details' | 'exhibitors' | 'students' | 'qrcodes'>('details')
  const [exhibitors, setExhibitors] = useState<ExhibitorRegistration[]>([])
  const [students, setStudents] = useState<StudentRegistration[]>([])
  const [updating, setUpdating] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => { fetchSalon() }, [eventId])

  useEffect(() => {
    if (!salon) return
    if (tab === 'exhibitors') fetchExhibitors()
    if (tab === 'students' || tab === 'qrcodes') fetchStudents()
  }, [tab, salon])

  async function fetchSalon() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Salon non trouvé')
      setSalon(data.data)
      setFormData({
        name: data.data.name,
        city: data.data.city,
        event_date: data.data.event_date?.split('T')[0] ?? '',
        is_active: data.data.is_active ?? false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function fetchExhibitors() {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/exhibitors`)
      const data = await res.json()
      setExhibitors(data.data || [])
    } catch (err) {
      console.error('Failed to fetch exhibitors:', err)
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/students`)
      const data = await res.json()
      setStudents(data.data || [])
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }

  async function handleUpdate() {
    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city,
          event_date: new Date(formData.event_date).toISOString(),
          is_active: formData.is_active,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSalon(data.data)
      setEditMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  async function handleRemoveExhibitor(exhibitorId: string) {
    setRemovingId(exhibitorId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/exhibitors?exhibitor_id=${exhibitorId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setExhibitors(prev => prev.filter(e => e.id !== exhibitorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleGenerateQRCodes() {
    setGeneratingQR(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/generate-qr`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération QR')
    } finally {
      setGeneratingQR(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: C.gray500, fontSize: 15 }}>
        Chargement...
      </div>
    )
  }

  if (!salon) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <p style={{ color: C.tomate, fontWeight: 700 }}>Salon non trouvé</p>
        <button onClick={() => router.push('/admin/salons')} style={btnSecondary}>Retour aux salons</button>
      </div>
    )
  }

  const statusBadge = salon.is_active
    ? { label: 'En direct', bg: '#dcfce7', color: C.green }
    : new Date(salon.event_date) > new Date()
      ? { label: 'À venir', bg: C.tomateLight, color: C.tomate }
      : { label: 'Archivé', bg: C.gray100, color: C.gray500 }

  return (
    <div style={{ background: C.blanc, minHeight: '100vh' }}>
      {/* Top stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.tomate} 0% 33%, ${C.piscine} 33% 66%, #FCD716 66% 100%)` }} />

      <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Back */}
        <button onClick={() => router.push('/admin/salons')} style={{ ...btnSecondary, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Retour aux salons
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: C.noir, textTransform: 'uppercase' }}>
                {salon.name}
              </h1>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBadge.bg, color: statusBadge.color }}>
                {statusBadge.label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: C.gray500 }}>
              {salon.city} · {new Date(salon.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} style={btnPrimary}>
              Éditer
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: C.tomateLight, border: `1px solid ${C.tomate}`, borderRadius: 6, color: C.tomate, fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: C.tomate, cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `2px solid ${C.gray200}` }}>
          {(['details', 'exhibitors', 'students', 'qrcodes'] as const).map(t => {
            const labels = { details: 'Détails', exhibitors: `Exposants (${exhibitors.length})`, students: `Étudiants (${students.length})`, qrcodes: 'Codes QR' }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? `2px solid ${C.tomate}` : '2px solid transparent',
                  marginBottom: -2,
                  color: tab === t ? C.tomate : C.gray500,
                  fontWeight: tab === t ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.15s',
                }}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>

        {/* ── Details Tab ── */}
        {tab === 'details' && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, border: `1px solid ${C.gray200}` }}>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field label="Nom du salon">
                  <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Ville">
                  <input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Date">
                  <input type="date" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Statut">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: C.tomate }}
                    />
                    <span style={{ fontSize: 14, color: C.noir }}>Salon en direct (actif)</span>
                  </label>
                </Field>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={() => { setEditMode(false); setError(null) }} style={btnSecondary}>Annuler</button>
                  <button onClick={handleUpdate} disabled={updating} style={{ ...btnPrimary, opacity: updating ? 0.6 : 1 }}>
                    {updating ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <InfoCell label="Nom" value={salon.name} />
                <InfoCell label="Ville" value={salon.city} />
                <InfoCell label="Date" value={new Date(salon.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoCell label="Statut" value={salon.is_active ? '🟢 En direct' : '⚫ Inactif'} />
              </div>
            )}
          </div>
        )}

        {/* ── Exhibitors Tab ── */}
        {tab === 'exhibitors' && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, border: `1px solid ${C.gray200}` }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: C.noir }}>
              Exposants inscrits ({exhibitors.length})
            </h3>
            {exhibitors.length === 0 ? (
              <p style={{ color: C.gray500, textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Aucun exposant inscrit pour ce salon</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {exhibitors.map(ex => (
                  <div key={ex.id} style={{ padding: '14px 16px', background: C.gray100, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: C.noir, fontSize: 14 }}>{ex.school_name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray500 }}>
                        Inscrit le {new Date(ex.registered_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExhibitor(ex.id)}
                      disabled={removingId === ex.id}
                      style={{ padding: '6px 14px', background: 'transparent', color: C.tomate, border: `1px solid ${C.tomate}`, borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: 12, opacity: removingId === ex.id ? 0.5 : 1 }}
                    >
                      {removingId === ex.id ? '...' : 'Retirer'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Students Tab ── */}
        {tab === 'students' && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, border: `1px solid ${C.gray200}` }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: C.noir }}>
              Étudiants inscrits ({students.length})
            </h3>
            {students.length === 0 ? (
              <p style={{ color: C.gray500, textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Aucun étudiant inscrit pour ce salon</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.gray100 }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: C.gray700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Nom</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: C.gray700, textTransform: 'uppercase', fontSize: 11 }}>Entrée</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: C.gray700, textTransform: 'uppercase', fontSize: 11 }}>Sortie</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: C.gray700, textTransform: 'uppercase', fontSize: 11 }}>Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${C.gray200}`, background: i % 2 === 0 ? '#fff' : C.gray100 }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500 }}>{s.user_name}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ color: s.scanned_entry ? C.green : C.gray500, fontWeight: 700, fontSize: 16 }}>
                            {s.scanned_entry ? '✓' : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ color: s.scanned_exit ? C.green : C.gray500, fontWeight: 700, fontSize: 16 }}>
                            {s.scanned_exit ? '✓' : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, color: C.gray500 }}>
                          {new Date(s.registered_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── QR Codes Tab ── */}
        {tab === 'qrcodes' && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, border: `1px solid ${C.gray200}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: C.noir }}>Codes QR Entrée / Sortie</h3>
                <p style={{ margin: 0, color: C.gray500, fontSize: 13 }}>
                  {students.length === 0
                    ? 'Aucun étudiant inscrit — les codes QR seront disponibles après inscription.'
                    : `${students.length} étudiant${students.length > 1 ? 's' : ''} — cliquez sur Générer pour créer les codes QR.`}
                </p>
              </div>
              {students.length > 0 && (
                <button
                  onClick={handleGenerateQRCodes}
                  disabled={generatingQR}
                  style={{ ...btnPrimary, opacity: generatingQR ? 0.6 : 1 }}
                >
                  {generatingQR ? 'Génération...' : 'Générer les codes QR'}
                </button>
              )}
            </div>

            {students.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {students.map(s => (
                  <div key={s.id} style={{ padding: 16, border: `1px solid ${C.gray200}`, borderRadius: 8, background: C.blanc }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.noir }}>{s.user_name}</p>

                    {s.entry_qr ? (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entrée</p>
                        <img src={s.entry_qr} alt={`QR Entrée — ${s.user_name}`} style={{ width: '100%', display: 'block', borderRadius: 4, border: `1px solid ${C.gray200}` }} />
                      </div>
                    ) : (
                      <div style={{ marginBottom: 12, padding: 16, background: C.gray100, borderRadius: 4, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 11, color: C.gray500 }}>Entrée — non généré</p>
                      </div>
                    )}

                    {s.exit_qr ? (
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: 10, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sortie</p>
                        <img src={s.exit_qr} alt={`QR Sortie — ${s.user_name}`} style={{ width: '100%', display: 'block', borderRadius: 4, border: `1px solid ${C.gray200}` }} />
                      </div>
                    ) : (
                      <div style={{ padding: 16, background: C.gray100, borderRadius: 4, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 11, color: C.gray500 }}>Sortie — non généré</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#EC1F27',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  background: 'transparent',
  color: '#3D3D3D',
  border: '1.5px solid #E8E8E8',
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E8E8E8',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#191829', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6B6B6B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#191829' }}>{value}</p>
    </div>
  )
}
