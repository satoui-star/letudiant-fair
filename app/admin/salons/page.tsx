'use client'
import { useEffect, useState } from 'react'
import type { EventRow } from '@/lib/supabase/types'

const C = {
  tomate: '#EC1F27', tomateLight: '#FFF0F1',
  piscine: '#0066CC', piscineLight: '#E6F0FF',
  citron: '#FCD716', citronLight: '#FFF9E6',
  spirit: '#FF6B35', spiritLight: '#FFF0E6',
  framboise: '#E91E63', framboiseLight: '#FCE4EC',
  menthe: '#00AA66', mentheLight: '#E0F5EC',
  tropical: '#00BFB3', tropicalLight: '#E0F7F5',
  papyri: '#CDDC39', papyriLight: '#F7F9E1',
  nuit: '#2B1B4D',
  noir: '#191829',
  gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4', blanc: '#F8F7F2',
}

// Palette pour les différentes villes/salons (charte graphique)
const SALON_COLORS = [
  { color: C.tomate, light: C.tomateLight, name: 'Tomate' },
  { color: C.piscine, light: C.piscineLight, name: 'Piscine' },
  { color: C.framboise, light: C.framboiseLight, name: 'Framboise' },
  { color: C.spirit, light: C.spiritLight, name: 'Spirit' },
  { color: C.menthe, light: C.mentheLight, name: 'Menthe' },
  { color: C.tropical, light: C.tropicalLight, name: 'Tropical' },
  { color: C.citron, light: C.citronLight, name: 'Citron' },
  { color: C.papyri, light: C.papyriLight, name: 'Papyri' },
]

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
    if (event.is_active) return { label: 'En direct', color: C.menthe, pulse: true }
    return { label: 'Archivé', color: C.gray500 }
  }

  const getSalonColor = (index: number) => SALON_COLORS[index % SALON_COLORS.length]

  return (
    <div style={{ padding: '0', background: C.blanc, minHeight: '100vh' }}>
      {/* Signature stripe (Charte 24/25) */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: `linear-gradient(90deg, ${C.tomate} 0% 33.33%, ${C.piscine} 33.33% 66.66%, ${C.citron} 66.66% 100%)`,
        }}
      />

      <div style={{ padding: '32px 40px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 40,
            paddingBottom: 24,
            borderBottom: `1px solid ${C.gray200}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: C.noir,
                paddingBottom: 6,
                display: 'inline-block',
                position: 'relative',
                marginBottom: 16,
              }}
            >
              Administration
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: 28,
                  height: 3,
                  background: C.tomate,
                }}
              />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 42,
                fontWeight: 900,
                color: C.noir,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Salons
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 15, color: C.gray500 }}>
              Gérez tous les salons de l'orientation L'Étudiant
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '14px 28px',
              background: C.tomate,
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(236,31,39,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(236,31,39,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(236,31,39,0.25)'
            }}
          >
            + Créer un salon
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['all', 'upcoming', 'live', 'archived'] as const).map(status => {
            const isActive = statusFilter === status
            const label = status === 'all' ? 'Tous' : status === 'upcoming' ? 'À venir' : status === 'live' ? 'En direct' : 'Archivés'
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '10px 20px',
                  background: isActive ? C.noir : 'transparent',
                  color: isActive ? '#fff' : C.gray700,
                  border: `1.5px solid ${isActive ? C.noir : C.gray200}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: C.gray500 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${C.gray200}`,
                borderTop: `3px solid ${C.tomate}`,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Chargement des salons...
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#fff',
              borderRadius: 8,
              border: `1px dashed ${C.gray200}`,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                gap: 4,
                marginBottom: 16,
              }}
            >
              {[C.tomate, C.piscine, C.citron, C.menthe, C.framboise].map((c, i) => (
                <span
                  key={i}
                  style={{ width: 12, height: 12, background: c, borderRadius: 2 }}
                />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.noir, textTransform: 'uppercase' }}>
              Aucun salon trouvé
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.gray500 }}>
              Créez votre premier salon pour commencer
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {events.map((event, idx) => {
              const badge = getStatusBadge(event)
              const eventDate = new Date(event.event_date)
              const salonColor = getSalonColor(idx)
              return (
                <div
                  key={event.id}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `1px solid ${C.gray200}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Colored accent header */}
                  <div
                    style={{
                      height: 80,
                      background: salonColor.color,
                      position: 'relative',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Multicolor stripe */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg,
                          ${C.tomate} 0% 12.5%,
                          ${C.spirit} 12.5% 25%,
                          ${C.citron} 25% 37.5%,
                          ${C.papyri} 37.5% 50%,
                          ${C.menthe} 50% 62.5%,
                          ${C.tropical} 62.5% 75%,
                          ${C.piscine} 75% 87.5%,
                          ${C.framboise} 87.5% 100%
                        )`,
                      }}
                    />

                    {/* Status Badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        alignSelf: 'flex-start',
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: badge.color,
                      }}
                    >
                      {badge.pulse && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: badge.color,
                            animation: 'pulse 1.5s infinite',
                          }}
                        />
                      )}
                      {badge.label}
                    </div>
                    {/* Italic logo-style city name */}
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: '#fff',
                        fontStyle: 'italic',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {event.city}
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    {/* Name & Date */}
                    <h3
                      style={{
                        margin: '0 0 4px',
                        fontSize: 18,
                        fontWeight: 800,
                        color: C.noir,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                      }}
                    >
                      {event.name}
                    </h3>
                    <p
                      style={{
                        margin: '0 0 20px',
                        fontSize: 13,
                        color: C.gray500,
                        fontWeight: 500,
                      }}
                    >
                      {eventDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>

                    {/* Quick Stats */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 20,
                        paddingBottom: 20,
                        borderBottom: `1px solid ${C.gray200}`,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: '0 0 4px',
                            fontSize: 10,
                            color: C.gray500,
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                          }}
                        >
                          Pré-inscrits
                        </p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.noir, letterSpacing: '-0.02em' }}>
                          —
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            margin: '0 0 4px',
                            fontSize: 10,
                            color: C.gray500,
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                          }}
                        >
                          Stands
                        </p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.noir, letterSpacing: '-0.02em' }}>
                          —
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        style={{
                          padding: '10px 12px',
                          background: C.noir,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = salonColor.color)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = C.noir)}
                      >
                        Détails
                      </button>
                      <button
                        style={{
                          padding: '10px 12px',
                          background: 'transparent',
                          color: C.noir,
                          border: `1.5px solid ${C.gray200}`,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = C.noir
                          e.currentTarget.style.background = C.gray100
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.gray200
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Éditer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(25,24,41,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 480,
              width: '100%',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Multicolor stripe at top of modal */}
            <div
              style={{
                height: 6,
                background: `linear-gradient(90deg, ${C.tomate} 0% 33.33%, ${C.piscine} 33.33% 66.66%, ${C.citron} 66.66% 100%)`,
              }}
            />
            <div style={{ padding: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: C.tomate,
                  marginBottom: 8,
                }}
              >
                Nouveau salon
              </div>
              <h2
                style={{
                  margin: '0 0 24px',
                  fontSize: 28,
                  fontWeight: 900,
                  color: C.noir,
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                }}
              >
                Créer un salon
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.noir,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 6,
                    }}
                  >
                    Nom du salon
                  </label>
                  <input
                    type="text"
                    placeholder="Salon de l'Étudiant Paris"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1.5px solid ${C.gray200}`,
                      borderRadius: 4,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.gray200)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.noir,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 6,
                    }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1.5px solid ${C.gray200}`,
                      borderRadius: 4,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.noir,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 6,
                    }}
                  >
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Paris"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1.5px solid ${C.gray200}`,
                      borderRadius: 4,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    color: C.noir,
                    border: `1.5px solid ${C.gray200}`,
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  style={{
                    padding: '12px 20px',
                    background: C.tomate,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                  }}
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
