'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toaster'
import OrientationBadge from '@/components/ui/OrientationBadge'
import SectionLabel from '@/components/ui/SectionLabel'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const DOMAINS = [
  { id: 'Droit et Sciences Politiques', label: 'Droit & Politique', emoji: '⚖️' },
  { id: 'Économie et Gestion', label: 'Économie', emoji: '📊' },
  { id: 'Commerce et Marketing', label: 'Commerce', emoji: '💼' },
  { id: 'Informatique et Numérique', label: 'Tech / IA', emoji: '💻' },
  { id: 'Sciences et Technologies', label: 'Sciences', emoji: '🔬' },
  { id: 'Santé', label: 'Santé', emoji: '🏥' },
  { id: 'Lettres et Sciences Humaines', label: 'Lettres & SHS', emoji: '📚' },
  { id: 'Arts et Culture', label: 'Arts', emoji: '🎭' },
  { id: 'Social et Éducation', label: 'Social & Éducation', emoji: '🤝' },
]

interface FairEntry {
  eventId: string
  eventName: string
  eventCity: string
  scanCount: number
  date: string
}

interface ConsentState {
  letudiant: boolean
  partners: boolean
  wax: boolean
}

const INTENT_LABELS: Record<string, { label: string; color: string; bg: string; pct: number }> = {
  low:    { label: 'Explorateur',  color: '#1d4ed8', bg: '#EFF6FF', pct: 20 },
  medium: { label: 'Comparateur', color: '#92400e', bg: '#FEF9C3', pct: 55 },
  high:   { label: 'Décideur',    color: '#15803d', bg: '#DCFCE7', pct: 90 },
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()

  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [consents, setConsents] = useState<ConsentState>({ letudiant: false, partners: false, wax: false })
  const [fairHistory, setFairHistory] = useState<FairEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [savingConsent, setSavingConsent] = useState<string | null>(null)

  // Sync state from profile once loaded
  useEffect(() => {
    if (!profile) return
    setInterests(new Set(profile.education_branches ?? []))
    setConsents({
      letudiant: profile.optin_letudiant ?? false,
      partners:  profile.optin_commercial ?? false,
      wax:       profile.optin_wax ?? false,
    })
  }, [profile])

  // Load fair history: scans grouped by event
  useEffect(() => {
    if (!user) return
    async function loadHistory() {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('scans')
        .select('event_id, events(name, city, event_date)')
        .eq('user_id', user!.id)
        .eq('channel', 'stand')

      if (!data) return

      // Group by eventId
      const map = new Map<string, { name: string; city: string; date: string; count: number }>()
      for (const row of data) {
        const ev = (row as any).events
        if (!ev) continue
        const existing = map.get(row.event_id)
        if (existing) {
          existing.count++
        } else {
          map.set(row.event_id, {
            name: ev.name ?? 'Salon',
            city: ev.city ?? '',
            date: ev.event_date ?? '',
            count: 1,
          })
        }
      }

      setFairHistory(
        Array.from(map.entries()).map(([eventId, v]) => ({
          eventId,
          eventName: v.name,
          eventCity: v.city,
          scanCount: v.count,
          date: v.date,
        })).sort((a, b) => a.date.localeCompare(b.date))
      )
    }
    loadHistory()
  }, [user])

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function saveInterests() {
    if (!user) return
    setSaving(true)
    try {
      const supabase = getSupabase()
      await supabase.from('users').update({ education_branches: Array.from(interests) }).eq('id', user.id)
      toast('✓ Intérêts sauvegardés', 'success')
    } catch {
      toast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleConsent(key: keyof ConsentState) {
    if (!user) return
    const newVal = !consents[key]
    setSavingConsent(key)
    setConsents(prev => ({ ...prev, [key]: newVal }))
    try {
      const supabase = getSupabase()
      const field = key === 'letudiant' ? 'optin_letudiant' : key === 'partners' ? 'optin_commercial' : 'optin_wax'
      await supabase.from('users').update({
        [field]: newVal,
        consent_date: new Date().toISOString(),
      }).eq('id', user.id)
    } catch {
      // Rollback
      setConsents(prev => ({ ...prev, [key]: !newVal }))
      toast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSavingConsent(null)
    }
  }

  async function handleSignOut() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    toast('Pour supprimer votre compte, contactez support@letudiant.fr', 'info')
  }

  // Profile completion score
  const completionFields = [
    !!profile?.name,
    !!profile?.email,
    !!profile?.dob,
    !!profile?.education_level,
    !!profile?.postal_code,
    (profile?.education_branches?.length ?? 0) > 0,
  ]
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)

  // Initials
  const name = profile?.name ?? user?.email ?? '—'
  const initials = name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()

  const intentInfo = INTENT_LABELS[profile?.intent_level ?? 'low']

  if (loading) {
    return (
      <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh', padding: '24px 20px' }}>
        <Skeleton height={80} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton height={40} borderRadius={10} style={{ marginBottom: 12 }} />
        <Skeleton height={120} borderRadius={12} />
      </div>
    )
  }

  return (
    <div className="page-with-nav" style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      {/* Profile header */}
      <div style={{ background: '#fff', padding: '24px 20px 20px', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Avatar */}
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC1F27, #C41520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 24, flexShrink: 0,
              boxShadow: '0 4px 16px rgba(227,0,27,0.3)',
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="le-h3" style={{ margin: '0 0 4px' }}>{name}</h1>
            <p className="le-caption" style={{ margin: '0 0 8px' }}>
              {profile?.education_level ?? 'Niveau non renseigné'}
              {profile?.postal_code ? ` · ${profile.postal_code}` : ''}
            </p>
            <OrientationBadge score={profile?.orientation_score ?? 0} />
          </div>
        </div>

        {/* Intent level bar */}
        {profile && (
          <div
            style={{
              marginTop: 14, background: intentInfo.bg, borderRadius: 10,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: intentInfo.color }}>
                  Niveau d&apos;intérêt · {intentInfo.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: intentInfo.color }}>
                  {profile.intent_score ?? 0}/100
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${profile.intent_score ?? 0}%`,
                    background: intentInfo.color,
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Profile completion */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600 }}>Profil complété</span>
            <span style={{ fontSize: 12, color: '#EC1F27', fontWeight: 700 }}>{completionPct}%</span>
          </div>
          <div style={{ height: 6, background: '#E8E8E8', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', width: `${completionPct}%`,
                background: 'linear-gradient(90deg, #EC1F27, #FF4D4D)',
                borderRadius: 3, transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Interests section */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>Mes intérêts</SectionLabel>
        <p className="le-caption" style={{ marginTop: 6, marginBottom: 14 }}>
          Sélectionnez vos filières pour des recommandations personnalisées
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DOMAINS.map((domain) => {
            const active = interests.has(domain.id)
            return (
              <button
                key={domain.id}
                onClick={() => toggleInterest(domain.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 24,
                  border: `1.5px solid ${active ? '#EC1F27' : '#E8E8E8'}`,
                  background: active ? '#FFF0F1' : '#fff',
                  color: active ? '#EC1F27' : '#3D3D3D',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <span>{domain.emoji}</span>
                {domain.label}
              </button>
            )
          })}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={saveInterests}
          style={{ marginTop: 16 }}
        >
          {saving ? '…Sauvegarde' : 'Enregistrer mes intérêts'}
        </Button>
      </div>

      {/* Fair history */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Mes salons</SectionLabel>
        {fairHistory.length === 0 ? (
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 12 }}>
            Aucun salon visité pour le moment.
          </p>
        ) : (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
            {fairHistory.map((fair, index) => (
              <div
                key={fair.eventId}
                className="timeline-item"
                style={{ paddingBottom: index < fairHistory.length - 1 ? 20 : 0 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingLeft: 8 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: '#FFF0F1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}
                  >
                    🏙️
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: '#1A1A1A' }}>
                      {fair.eventName} — {fair.eventCity}
                    </p>
                    <p className="le-caption" style={{ margin: '0 0 4px' }}>
                      {fair.date ? new Date(fair.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </p>
                    <span
                      style={{
                        fontSize: 11, color: '#16A34A', fontWeight: 600,
                        background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 12,
                      }}
                    >
                      {fair.scanCount} stand{fair.scanCount > 1 ? 's' : ''} scanné{fair.scanCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data & Privacy */}
      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel>Données & Confidentialité</SectionLabel>

        <div className="le-card" style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
          {(
            [
              { key: 'letudiant' as const, label: "Communications L'Étudiant", description: 'Newsletters, offres et actualités' },
              { key: 'partners' as const,  label: 'Offres partenaires',          description: "Propositions d'écoles et d'entreprises partenaires" },
              { key: 'wax' as const,       label: 'Suivi post-salon (WAX)',       description: 'Notifications personnalisées après le salon' },
            ]
          ).map(({ key, label, description }, i, arr) => (
            <div
              key={key}
              style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12,
                borderBottom: i < arr.length - 1 ? '1px solid #E8E8E8' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: '#1A1A1A' }}>{label}</p>
                <p className="le-caption" style={{ margin: 0 }}>{description}</p>
              </div>
              <button
                role="switch"
                aria-checked={consents[key]}
                onClick={() => toggleConsent(key)}
                disabled={savingConsent === key}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: consents[key] ? '#EC1F27' : '#E8E8E8',
                  border: 'none', cursor: 'pointer', padding: 2,
                  display: 'flex', alignItems: 'center',
                  justifyContent: consents[key] ? 'flex-end' : 'flex-start',
                  transition: 'background 0.2s ease', flexShrink: 0,
                  opacity: savingConsent === key ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAccount}
            style={{ color: '#EC1F27', borderColor: '#FFF0F1' }}
          >
            Supprimer mon compte
          </Button>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '24px 20px' }}>
        <Button
          variant="secondary"
          onClick={handleSignOut}
          style={{ justifyContent: 'center', width: '100%' }}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
