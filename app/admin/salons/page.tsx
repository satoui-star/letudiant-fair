'use client'
import { useEffect, useState } from 'react'
import type { EventRow } from '@/lib/supabase/types'

const C = {
  tomate: '#EC1F27', tomateLightLight: '#FFF0F1',
  piscine: '#0066CC', piscineLightLight: '#E6F0FF',
  citron: '#FCD716', citronLight: '#FFF9E6',
  spirit: '#FF6B35', spiritLight: '#FFF0E6',
  gray900: '#191829', gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4', blanc: '#F8F7F2',
}

export default function SalonsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'archived'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [statusFilter])

  async function fetchEvents() {
    setLoading(true)
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await fetch(`/api/admin/events${query}`)
      const data = await res.json()
      setEvents(data.data || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (event: EventRow) => {
    const now = new Date()
    const eventDate = new Date(event.event_date)
    if (eventDate > now) return { label: 'À venir', color: C.tomate }
    if (event.is_active) return { label: 'En direct', color: C.blue }
    return { label: 'Archivé', color: C.gray500 }
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: C.gray900 }}>Salons</h1>
          <p style={{ margin: 0, fontSize: 14, color: C.gray500 }}>Gérez tous les salons de l'orientation</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: C.tomate,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Créer un salon
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {(['all', 'upcoming', 'live', 'archived'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '8px 16px',
              background: statusFilter === status ? C.tomate : C.gray100,
              color: statusFilter === status ? '#fff' : C.gray700,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {status === 'all' ? 'Tous' : status === 'upcoming' ? 'À venir' : status === 'live' ? 'En direct' : 'Archivés'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray500 }}>Chargement...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray500 }}>
          Aucun salon trouvé
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {events.map(event => {
            const badge = getStatusBadge(event)
            const eventDate = new Date(event.event_date)
            return (
              <div
                key={event.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: `1px solid ${C.gray200}`,
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: badge.color,
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  {badge.label}
                </div>

                {/* Name & Date */}
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>
                  {event.name}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: C.gray500 }}>
                  {eventDate.toLocaleDateString('fr-FR')} • {event.city}
                </p>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: '8px', background: C.gray100, borderRadius: 6 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>
                      Pré-inscrits
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.gray900 }}>—</p>
                  </div>
                  <div style={{ padding: '8px', background: C.gray100, borderRadius: 6 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>
                      Stands
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.gray900 }}>—</p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    style={{
                      padding: '8px 12px',
                      background: C.blueLight,
                      color: C.blue,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Détails
                  </button>
                  <button
                    style={{
                      padding: '8px 12px',
                      background: C.gray200,
                      color: C.gray700,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Éditer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Créer un salon</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Nom du salon"
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${C.gray200}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <input
                type="date"
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${C.gray200}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <input
                type="text"
                placeholder="Ville"
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${C.gray200}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 16px',
                  background: C.gray100,
                  color: C.gray700,
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                style={{
                  padding: '10px 16px',
                  background: C.tomate,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
