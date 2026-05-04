'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import SectionLabel from '@/components/ui/SectionLabel'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlotAppointment {
  id: string
  label: string
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled'
  slot_duration: number
  student_notes: string | null
}

interface SlotGroup {
  slot_time: string
  total: number
  pending: number
  confirmed: number
  cancelled: number
  appointments: SlotAppointment[]
}

interface Summary {
  pending: number
  confirmed: number
  attended: number
  cancelled: number
}

interface EventOption {
  id: string
  name: string
  event_date: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:   '#F59E0B',
  confirmed: '#16A34A',
  attended:  '#0066CC',
  cancelled: '#9CA3AF',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'En attente d\'entrée',
  confirmed: 'Entré au salon ✓',
  attended:  'Présent au stand',
  cancelled: 'Annulé',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExhibitorAppointmentsPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [noSchool, setNoSchool] = useState(false)
  const [schoolName, setSchoolName] = useState('')

  const [summary, setSummary] = useState<Summary | null>(null)
  const [groups, setGroups] = useState<SlotGroup[]>([])
  const [eventInfo, setEventInfo] = useState<{ name: string; event_date: string } | null>(null)

  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')

  // ── Resolve school + registered events ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function init() {
      const supabase = getSupabase()
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, name')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (cancelled) return

      if (!schoolData) {
        setNoSchool(true)
        setLoading(false)
        return
      }

      setSchoolName(schoolData.name ?? '')

      // Only show events this school is registered for
      const { data: regs } = await supabase
        .from('event_exhibitors')
        .select('event_id, events(id, name, event_date)')
        .eq('school_id', schoolData.id)

      if (cancelled) return

      const evList: EventOption[] = (regs ?? [])
        .map((r: any) => r.events)
        .filter(Boolean)
        .sort((a: EventOption, b: EventOption) => a.event_date.localeCompare(b.event_date))

      setEvents(evList)

      // Default to the closest upcoming event
      const today = new Date().toISOString().slice(0, 10)
      const upcoming = evList.find(ev => ev.event_date >= today)
      setSelectedEventId((upcoming ?? evList[0])?.id ?? '')
    }

    init()
    return () => { cancelled = true }
  }, [user?.id])

  // ── Fetch appointments when event changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedEventId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setSummary(null)
    setGroups([])
    setEventInfo(null)

    fetch(`/api/exhibitor/appointments?eventId=${selectedEventId}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setNoSchool(true); return }
        setSummary(json.summary ?? null)
        setGroups(json.groups ?? [])
        setEventInfo(json.event ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedEventId])

  // ── Guards ────────────────────────────────────────────────────────────────
  if (noSchool) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
        <span style={{ fontSize: 48 }}>🏫</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '16px 0 8px', color: '#1A1A1A' }}>
          Aucun établissement lié
        </h2>
        <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 24 }}>
          Complétez votre profil puis inscrivez-vous à un salon.
        </p>
        <a
          href="/exhibitor/profile"
          style={{ display: 'inline-block', background: '#EC1F27', color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Compléter mon profil →
        </a>
      </div>
    )
  }

  const totalActive = (summary?.pending ?? 0) + (summary?.confirmed ?? 0) + (summary?.attended ?? 0)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>Rendez-vous</SectionLabel>
        <h1 className="le-h1" style={{ marginTop: 10 }}>Mes rendez-vous</h1>
        <p className="le-body">
          Réservations étudiants pour votre stand. Confirmés automatiquement à l&apos;entrée du salon.
        </p>
      </div>

      {/* No events registered */}
      {!loading && events.length === 0 && (
        <div className="le-card le-card-padded" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>📅</span>
          <p style={{ color: '#6B6B6B', margin: 0 }}>
            Inscrivez-vous d&apos;abord à un salon depuis{' '}
            <a href="/exhibitor/salons" style={{ color: '#EC1F27', fontWeight: 700 }}>Mes salons</a>.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <>
          {/* Event selector */}
          {events.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#3D3D3D', display: 'block', marginBottom: 6 }}>
                Salon
              </label>
              <select
                className="le-input"
                style={{ maxWidth: 400 }}
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event label */}
          {eventInfo && (
            <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 20 }}>
              📅 <strong>{eventInfo.name}</strong> · {fmtDate(eventInfo.event_date)}
            </p>
          )}

          {/* Confirmation info */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
              <strong>Confirmation automatique :</strong> un rendez-vous passe de <em>En attente</em> à <em>Confirmé</em>
              {' '}dès que l&apos;étudiant scanne le QR d&apos;entrée du salon. Aucune action manuelle requise.
            </p>
          </div>

          {/* Summary KPIs */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} borderRadius={12} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Total réservés', value: totalActive,             color: '#1A1A1A', desc: 'hors annulations' },
                { label: 'En attente',     value: summary?.pending ?? 0,   color: '#F59E0B', desc: 'Pas encore entrés' },
                { label: 'Confirmés',      value: summary?.confirmed ?? 0, color: '#16A34A', desc: 'Entrée scannée ✓' },
                { label: 'Annulés',        value: summary?.cancelled ?? 0, color: '#9CA3AF', desc: 'Rendez-vous annulé' },
              ].map(k => (
                <div key={k.label} className="le-card le-card-padded" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color: k.color }}>{k.value}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{k.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Slot groups */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={90} borderRadius={12} />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="le-card le-card-padded" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', margin: '0 0 6px' }}>
                Aucun rendez-vous pour ce salon
              </p>
              <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>
                Les étudiants peuvent réserver depuis la fiche de votre école sur l&apos;application.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groups.map(group => (
                <SlotGroupCard key={group.slot_time} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── SlotGroupCard ─────────────────────────────────────────────────────────────

function SlotGroupCard({ group }: { group: SlotGroup }) {
  const [expanded, setExpanded] = useState(false)

  const allConfirmed = group.confirmed === group.total && group.total > 0
  const hasAny = group.total > 0

  return (
    <div
      className="le-card"
      style={{
        borderLeft: `4px solid ${allConfirmed ? '#16A34A' : group.pending > 0 ? '#F59E0B' : '#E8E8E8'}`,
        overflow: 'hidden',
      }}
    >
      {/* Row header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', textAlign: 'left',
        }}
      >
        {/* Time */}
        <div style={{ minWidth: 80 }}>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
            {fmtTime(group.slot_time)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
            {new Date(group.slot_time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Status pills */}
        <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {group.confirmed > 0 && (
            <StatusPill count={group.confirmed} label="confirmé" color="#16A34A" bg="#D1FAE5" />
          )}
          {group.pending > 0 && (
            <StatusPill count={group.pending} label="en attente" color="#92400E" bg="#FEF3C7" />
          )}
          {group.cancelled > 0 && (
            <StatusPill count={group.cancelled} label="annulé" color="#6B7280" bg="#F3F4F6" />
          )}
          {!hasAny && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Aucune réservation</span>
          )}
        </div>

        {/* Expand toggle */}
        <span style={{ fontSize: 13, color: '#9CA3AF', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded appointment list */}
      {expanded && group.appointments.length > 0 && (
        <div style={{ borderTop: '1px solid #F0F0F0', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.appointments.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: STATUS_COLOR[a.status] ?? '#9CA3AF',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3D3D3D', minWidth: 100 }}>
                {a.label}
              </span>
              <span style={{ fontSize: 12, color: STATUS_COLOR[a.status] ?? '#9CA3AF', fontWeight: 600 }}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                · {a.slot_duration} min
              </span>
              {a.student_notes && (
                <span style={{ fontSize: 11, color: '#6B6B6B', fontStyle: 'italic' }}>
                  · note
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, color,
      background: bg, borderRadius: 999,
      padding: '3px 10px',
    }}>
      {count} {label}{count > 1 && label !== 'en attente' ? 's' : ''}
    </span>
  )
}
