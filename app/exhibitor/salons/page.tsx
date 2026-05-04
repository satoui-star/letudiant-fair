'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import SectionLabel from '@/components/ui/SectionLabel'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

interface EventRow {
  id: string
  name: string
  event_date: string
  city: string | null
  venue: string | null
}

interface Registration {
  event_id: string
  qr_code: string | null
  qr_generated_at: string | null
}

interface EventWithStatus extends EventRow {
  registered: boolean
  qr_code: string | null
  qr_generated_at: string | null
  isPast: boolean
}

export default function ExhibitorSalonsPage() {
  const { user } = useAuth()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [events, setEvents] = useState<EventWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [noSchool, setNoSchool] = useState(false)

  // Per-event action state: eventId → 'registering' | 'unregistering' | 'generating' | null
  const [actionState, setActionState] = useState<Record<string, string | null>>({})
  const [actionError, setActionError] = useState<Record<string, string | null>>({})

  // ── Load events + registrations ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function load() {
      const supabase = getSupabase()

      // Resolve school
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

      setSchoolId(schoolData.id)
      setSchoolName(schoolData.name ?? '')

      // Load all events + this school's registrations in parallel
      const [eventsRes, regsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, name, event_date, city, venue')
          .order('event_date', { ascending: true }),
        supabase
          .from('event_exhibitors')
          .select('event_id, qr_code, qr_generated_at')
          .eq('school_id', schoolData.id),
      ])

      if (cancelled) return

      const allEvents: EventRow[] = eventsRes.data ?? []
      const regs: Registration[] = regsRes.data ?? []
      const regMap = new Map(regs.map(r => [r.event_id, r]))

      const today = new Date().toISOString().slice(0, 10)
      const merged: EventWithStatus[] = allEvents.map(ev => {
        const reg = regMap.get(ev.id)
        return {
          ...ev,
          registered: !!reg,
          qr_code: reg?.qr_code ?? null,
          qr_generated_at: reg?.qr_generated_at ?? null,
          isPast: ev.event_date < today,
        }
      })

      setEvents(merged)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  // ── Register for a fair ───────────────────────────────────────────────────
  async function handleRegister(eventId: string) {
    setActionState(s => ({ ...s, [eventId]: 'registering' }))
    setActionError(s => ({ ...s, [eventId]: null }))
    try {
      const res = await fetch('/api/exhibitor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setActionError(s => ({ ...s, [eventId]: json.error ?? 'Erreur' }))
        return
      }
      setEvents(prev =>
        prev.map(ev => ev.id === eventId ? { ...ev, registered: true } : ev)
      )
    } catch {
      setActionError(s => ({ ...s, [eventId]: 'Erreur réseau' }))
    } finally {
      setActionState(s => ({ ...s, [eventId]: null }))
    }
  }

  // ── Unregister from a fair ────────────────────────────────────────────────
  async function handleUnregister(eventId: string) {
    setActionState(s => ({ ...s, [eventId]: 'unregistering' }))
    setActionError(s => ({ ...s, [eventId]: null }))
    try {
      const res = await fetch('/api/exhibitor/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setActionError(s => ({ ...s, [eventId]: json.error ?? 'Erreur' }))
        return
      }
      setEvents(prev =>
        prev.map(ev => ev.id === eventId ? { ...ev, registered: false, qr_code: null, qr_generated_at: null } : ev)
      )
    } catch {
      setActionError(s => ({ ...s, [eventId]: 'Erreur réseau' }))
    } finally {
      setActionState(s => ({ ...s, [eventId]: null }))
    }
  }

  // ── Generate QR for a fair ────────────────────────────────────────────────
  async function handleGenerateQR(eventId: string) {
    setActionState(s => ({ ...s, [eventId]: 'generating' }))
    setActionError(s => ({ ...s, [eventId]: null }))
    try {
      const res = await fetch('/api/exhibitor/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setActionError(s => ({ ...s, [eventId]: json.error ?? 'Erreur génération QR' }))
        return
      }
      setEvents(prev =>
        prev.map(ev =>
          ev.id === eventId
            ? { ...ev, qr_code: json.qr, qr_generated_at: json.generatedAt }
            : ev
        )
      )
    } catch {
      setActionError(s => ({ ...s, [eventId]: 'Erreur réseau' }))
    } finally {
      setActionState(s => ({ ...s, [eventId]: null }))
    }
  }

  // ── Download a QR ─────────────────────────────────────────────────────────
  function handleDownload(qrDataUrl: string, eventName: string) {
    const a = document.createElement('a')
    a.download = `QR_${schoolName.replace(/\s/g, '_')}_${eventName.replace(/\s/g, '_')}.png`
    a.href = qrDataUrl
    a.click()
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 160, height: 14, background: '#E8E8E8', borderRadius: 4, marginBottom: 12 }} />
          <div style={{ width: 300, height: 28, background: '#E8E8E8', borderRadius: 6 }} />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} height={110} borderRadius={14} style={{ marginBottom: 14 }} />)}
      </div>
    )
  }

  if (noSchool) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
        <span style={{ fontSize: 48 }}>🏫</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '16px 0 8px', color: '#1A1A1A' }}>
          Aucun établissement lié
        </h2>
        <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 24 }}>
          Complétez d&apos;abord votre profil pour pouvoir vous inscrire aux salons.
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

  const upcoming = events.filter(e => !e.isPast)
  const past = events.filter(e => e.isPast)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Gestion des salons</SectionLabel>
        <h1 className="le-h1" style={{ marginTop: 10 }}>Mes salons</h1>
        <p className="le-body">
          Inscrivez-vous aux salons L&apos;Étudiant et gérez votre QR code par événement.
        </p>
      </div>

      {events.length === 0 && (
        <div className="le-card le-card-padded" style={{ textAlign: 'center', padding: '48px 24px', color: '#6B6B6B' }}>
          Aucun salon disponible pour le moment.
        </div>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Salons à venir
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {upcoming.map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                actionState={actionState[ev.id] ?? null}
                actionError={actionError[ev.id] ?? null}
                onRegister={() => handleRegister(ev.id)}
                onUnregister={() => handleUnregister(ev.id)}
                onGenerateQR={() => handleGenerateQR(ev.id)}
                onDownload={() => ev.qr_code && handleDownload(ev.qr_code, ev.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past events (registered only) */}
      {past.filter(e => e.registered).length > 0 && (
        <section>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Salons passés
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {past.filter(e => e.registered).map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                actionState={actionState[ev.id] ?? null}
                actionError={actionError[ev.id] ?? null}
                onRegister={() => handleRegister(ev.id)}
                onUnregister={() => handleUnregister(ev.id)}
                onGenerateQR={() => handleGenerateQR(ev.id)}
                onDownload={() => ev.qr_code && handleDownload(ev.qr_code, ev.name)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── EventCard sub-component ───────────────────────────────────────────────────

interface EventCardProps {
  event: EventWithStatus
  actionState: string | null
  actionError: string | null
  onRegister: () => void
  onUnregister: () => void
  onGenerateQR: () => void
  onDownload: () => void
}

function EventCard({ event, actionState, actionError, onRegister, onUnregister, onGenerateQR, onDownload }: EventCardProps) {
  const busy = actionState !== null
  const formattedDate = new Date(event.event_date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="le-card le-card-padded"
      style={{
        borderLeft: `4px solid ${event.registered ? '#16A34A' : event.isPast ? '#9CA3AF' : '#E8E8E8'}`,
        opacity: event.isPast ? 0.75 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1A1A1A' }}>{event.name}</span>
            {event.registered && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#D1FAE5', borderRadius: 999, padding: '2px 8px' }}>
                Inscrit ✓
              </span>
            )}
            {event.isPast && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F4F4F4', borderRadius: 999, padding: '2px 8px' }}>
                Passé
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B' }}>
            📅 {formattedDate}
            {event.city && <> · 📍 {event.city}</>}
            {event.venue && <> · {event.venue}</>}
          </p>
          {event.qr_generated_at && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
              ✓ QR généré le {new Date(event.qr_generated_at).toLocaleDateString('fr-FR')}
            </p>
          )}
          {actionError && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#DC2626', background: '#FEE2E2', borderRadius: 6, padding: '4px 8px' }}>
              ⚠ {actionError}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          {!event.registered && !event.isPast && (
            <Button variant="primary" size="sm" onClick={onRegister} disabled={busy}>
              {actionState === 'registering' ? 'Inscription…' : "S'inscrire"}
            </Button>
          )}

          {event.registered && !event.qr_code && !event.isPast && (
            <>
              <Button variant="primary" size="sm" onClick={onGenerateQR} disabled={busy}
                style={{ background: '#16A34A', borderColor: '#16A34A' }}>
                {actionState === 'generating' ? 'Génération…' : '✨ Générer mon QR'}
              </Button>
              <button
                onClick={onUnregister}
                disabled={busy}
                style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: busy ? 'wait' : 'pointer', padding: '2px 0', textDecoration: 'underline' }}
              >
                {actionState === 'unregistering' ? 'Désinscription…' : 'Se désinscrire'}
              </button>
            </>
          )}

          {event.registered && event.qr_code && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <img
                src={event.qr_code}
                alt={`QR ${event.name}`}
                style={{ width: 80, height: 80, borderRadius: 8, border: '1px solid #E8E8E8' }}
              />
              <button
                onClick={onDownload}
                style={{ fontSize: 12, color: '#0066CC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                ⬇ Télécharger
              </button>
            </div>
          )}

          {event.registered && event.isPast && !event.qr_code && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>QR non généré</span>
          )}
        </div>
      </div>
    </div>
  )
}
