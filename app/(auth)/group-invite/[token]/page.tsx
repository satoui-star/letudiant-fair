'use client'

import { use, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { getSupabase } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'

// ── Types ──────────────────────────────────────────────────────────────────────

interface GroupInfo {
  id: string
  school_name: string
  invite_link_expiry: string
  events: { name: string; event_date: string; city: string } | null
  teacher_name: string
}

interface JoinResult {
  userId: string
  name: string
  email: string
  isGuestEmail: boolean
  groupName: string
  eventName: string
  eventDate: string
  eventCity: string
}

// ── Education level options ────────────────────────────────────────────────────

const LEVELS = [
  { value: 'seconde',         label: 'Seconde' },
  { value: 'premiere',        label: 'Première' },
  { value: 'terminale',       label: 'Terminale' },
  { value: 'post-bac',        label: 'Post-bac / Réorientation' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GroupInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)

  const [group,    setGroup]    = useState<GroupInfo | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [expired,  setExpired]  = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [firstName,     setFirstName]     = useState('')
  const [lastName,      setLastName]      = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [educationLevel,setEducationLevel]= useState('')
  const [gdprAccepted,  setGdprAccepted]  = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [formError,     setFormError]     = useState<string | null>(null)

  const [joined,  setJoined]  = useState<JoinResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Load group info ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadGroup() {
      const supabase = getSupabase()

      // Step 1: look up group by token
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, school_name, fair_id, invite_link_expiry, teacher_id')
        .eq('invite_link', token)
        .maybeSingle()

      if (groupError || !groupData) { setLoading(false); setNotFound(true); return }
      if (new Date(groupData.invite_link_expiry) < new Date()) { setLoading(false); setExpired(true); return }

      // Step 2: fetch event and teacher name in parallel (public read, no auth needed)
      const [eventRes, teacherRes] = await Promise.all([
        supabase.from('events').select('name, event_date, city').eq('id', groupData.fair_id).maybeSingle(),
        supabase.from('users').select('name').eq('id', groupData.teacher_id).maybeSingle(),
      ])

      setLoading(false)
      setGroup({
        id:                 groupData.id,
        school_name:        groupData.school_name,
        invite_link_expiry: groupData.invite_link_expiry,
        events:             eventRes.data ?? null,
        teacher_name:       teacherRes.data?.name ?? 'Votre enseignant(e)',
      })
    }
    loadGroup()
  }, [token])

  // ── Generate QR on success ───────────────────────────────────────────────────
  useEffect(() => {
    if (!joined || !canvasRef.current) return
    const payload = JSON.stringify({ uid: joined.userId, app: 'letudiant-salons' })
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 240, margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    }).catch(console.error)
  }, [joined])

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    const res = await fetch('/api/group/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, firstName, lastName, email, password, gdprAccepted, educationLevel }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setFormError(json.error ?? 'Une erreur est survenue.')
      return
    }

    setJoined(json as JoinResult)
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (joined) {
    const eventDate = joined.eventDate
      ? new Date(joined.eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''

    return (
      <div style={{ minHeight: '100vh', background: '#F4F4F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#EC1F27,#0066CC)', padding: '24px 28px 20px', color: '#fff' }}>
            <Logo variant="inverted" size="sm" />
            <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', opacity: 0.85 }}>
              {joined.eventName}{joined.eventCity ? ` · ${joined.eventCity}` : ''}
            </p>
            {eventDate && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', opacity: 0.7 }}>{eventDate}</p>}
          </div>

          <div style={{ padding: '28px 28px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✅</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#1A1A1A' }}>Bienvenue, {joined.name.split(' ')[0]} !</h1>
            <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: '#6B6B6B' }}>Groupe : {joined.groupName}</p>

            {/* QR code */}
            <div style={{ background: '#F7F7F7', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A1A' }}>
                Ton QR code d&apos;entrée
              </p>
              <canvas ref={canvasRef} style={{ borderRadius: 10, display: 'block', margin: '0 auto' }} />
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#6B6B6B', lineHeight: 1.5 }}>
                Présente ce code à l&apos;entrée du salon et à chaque stand que tu visites.
              </p>
            </div>

            {/* Guest email warning */}
            {joined.isGuestEmail && (
              <div style={{ background: '#FFF9E6', border: '1px solid #FCD716', borderRadius: 10, padding: '12px 14px', marginBottom: 20, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5 }}>
                  <strong>💡 Conseil :</strong> Sans email, tu ne pourras pas retrouver ton dossier après le salon.
                  Fais une capture d&apos;écran de ton QR code.
                </p>
              </div>
            )}

            <a href="/home" style={{ display: 'block', background: '#EC1F27', color: '#fff', borderRadius: 10, padding: '13px 20px', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Accéder au salon →
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Error states ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F4' }}>
        <p style={{ color: '#6B6B6B', fontSize: '0.9375rem' }}>Chargement…</p>
      </div>
    )
  }

  if (notFound || expired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F4', padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{expired ? '⏰' : '🔗'}</div>
          <h2 style={{ margin: '0 0 10px', fontWeight: 800 }}>
            {expired ? 'Lien expiré' : 'Lien introuvable'}
          </h2>
          <p style={{ color: '#6B6B6B', fontSize: '0.9rem' }}>
            {expired
              ? 'Ce lien d\'invitation a expiré. Demandez un nouveau lien à votre enseignant(e).'
              : 'Ce lien d\'invitation est invalide ou a déjà été utilisé.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Registration form ───────────────────────────────────────────────────────
  const fairName = group?.events?.name ?? 'le salon'
  const fairDate = group?.events?.event_date
    ? new Date(group.events.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(26,26,26,0.07)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#EC1F27,#0066CC)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Logo variant="inverted" size="sm" />
          <Tag variant="yellow" className="self-start">Inscription de groupe</Tag>
        </div>

        <div style={{ padding: 32 }}>
          {/* Group info */}
          <div style={{ background: '#F4F4F4', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Invitation de
            </p>
            <p style={{ margin: '0 0 3px', fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>
              {group?.teacher_name}
            </p>
            <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: '#3D3D3D' }}>
              {group?.school_name}
            </p>
            {(fairName || fairDate) && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E6F0FF', borderRadius: 6, padding: '7px 12px' }}>
                <svg width={13} height={13} viewBox="0 0 14 14" fill="none" stroke="#0066CC" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                  <rect x="1" y="2" width="12" height="11" rx="2" />
                  <path d="M4 2V1M10 2V1M1 6h12" />
                </svg>
                <span style={{ fontSize: '0.8125rem', color: '#0066CC', fontWeight: 600 }}>
                  {fairName}{fairDate ? ` — ${fairDate}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Invitation note */}
          <div style={{ borderLeft: '3px solid #FCD716', paddingLeft: 12, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.6 }}>
              Remplis tes informations pour rejoindre le groupe et obtenir <strong>ton QR code d&apos;entrée</strong>.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input id="firstName" label="Prénom *" placeholder="Marie"   value={firstName} onChange={e => setFirstName(e.target.value)}  required />
                <Input id="lastName"  label="Nom *"    placeholder="Dupont"  value={lastName}  onChange={e => setLastName(e.target.value)}   required />
              </div>

              <Input id="email" type="email" label="Email (recommandé)" placeholder="marie@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} />
              <p style={{ margin: '-8px 0 0', fontSize: '0.75rem', color: '#6B6B6B', lineHeight: 1.4 }}>
                Sans email, vous ne pourrez pas retrouver votre dossier après le salon.
              </p>

              <Input id="password" type="password" label="Mot de passe *" placeholder="Choisissez un mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
              <p style={{ margin: '-8px 0 0', fontSize: '0.75rem', color: '#6B6B6B', lineHeight: 1.4 }}>
                Utilisez ce mot de passe pour vous connecter à votre espace étudiant.
              </p>

              {/* Education level */}
              <div>
                <label htmlFor="level" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>
                  Niveau scolaire
                </label>
                <select
                  id="level"
                  value={educationLevel}
                  onChange={e => setEducationLevel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E8E8', fontSize: '0.875rem', color: '#1A1A1A', background: '#fff', outline: 'none' }}
                >
                  <option value="">Sélectionner…</option>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              {/* GDPR */}
              <label htmlFor="gdpr" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: 12, background: '#F4F4F4', borderRadius: 8, border: `1.5px solid ${gdprAccepted ? '#EC1F27' : '#E8E8E8'}` }}>
                <input id="gdpr" type="checkbox" checked={gdprAccepted} onChange={e => setGdprAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#EC1F27', width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: '#3D3D3D', lineHeight: 1.5 }}>
                  J&apos;accepte que L&apos;Étudiant collecte mes données pour cet événement —{' '}
                  <a href="#" style={{ color: '#EC1F27', textDecoration: 'underline' }}>politique de confidentialité</a>. *
                </span>
              </label>

              {/* Error */}
              {formError && (
                <div style={{ background: '#FFF0F1', border: '1px solid #EC1F27', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#C41520' }}>{formError}</p>
                </div>
              )}

              <Button type="submit" variant="primary" disabled={submitting || !gdprAccepted || !firstName.trim() || !lastName.trim() || !password.trim()}>
                {submitting ? 'Inscription…' : 'Rejoindre le salon →'}
              </Button>
            </div>
          </form>

          <p style={{ marginTop: 16, fontSize: '0.6875rem', color: '#9B9B9B', lineHeight: 1.5, textAlign: 'center' }}>
            Lien réservé au groupe {group?.school_name}
          </p>
        </div>
      </div>
    </div>
  )
}
