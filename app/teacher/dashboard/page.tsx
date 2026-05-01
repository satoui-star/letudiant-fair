'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toaster'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import Icon, { type IconName } from '@/components/ui/Icon'
import type { GroupRow } from '@/lib/supabase/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface GroupMember {
  id:              string
  name:            string
  joined_at:       string
  has_profile:     boolean   // education_level filled in?
  pre_fair:        boolean   // registered before today?
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#EC1F27' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="le-kpi-card" style={{ padding: '20px 22px', flex: 1, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
        borderRadius: '3px 0 0 3px',
      }} />
      <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color: '#191829', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: '#9B9B9B' }}>{sub}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, profile } = useAuth()
  const { toast }         = useToast()

  const [group,        setGroup]        = useState<GroupRow | null>(null)
  const [members,      setMembers]      = useState<GroupMember[]>([])
  const [loading,      setLoading]      = useState(true)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [activeTab,    setActiveTab]    = useState<'prefair' | 'members'>('prefair')

  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // ── Load group ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()

      const { data: groupData } = await supabase
        .from('groups').select('*').eq('teacher_id', user!.id).maybeSingle()

      setGroup(groupData)

      if (groupData?.member_uids?.length) {
        const { data: membersData } = await supabase
          .from('users')
          .select('id, name, created_at, education_level')
          .in('id', groupData.member_uids)
          .order('created_at', { ascending: false })

        const fairDateStr = groupData.fair_id
          ? (await supabase.from('events').select('event_date').eq('id', groupData.fair_id).maybeSingle()).data?.event_date
          : null

        setMembers(
          (membersData ?? []).map(m => ({
            id:          m.id,
            name:        m.name,
            joined_at:   m.created_at,
            has_profile: !!(m as any).education_level,
            pre_fair:    fairDateStr
              ? new Date(m.created_at).toISOString().slice(0, 10) < fairDateStr
              : true,
          }))
        )
      }

      setLoading(false)
    }
    load()
  }, [user])

  // ── Generate QR ──────────────────────────────────────────────────────────────
  // Depends on loading + activeTab so the effect re-runs once the canvas is
  // actually in the DOM (canvas is conditional on !loading && group && tab=prefair).
  useEffect(() => {
    if (loading || !group || !qrCanvasRef.current) return
    const inviteUrl = `${window.location.origin}/group-invite/${group.invite_link}`
    QRCode.toCanvas(qrCanvasRef.current, inviteUrl, {
      width: 180, margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    }).catch(console.error)
  }, [group, loading, activeTab])

  // ── Create group ─────────────────────────────────────────────────────────────
  async function createGroup() {
    if (!user) return
    const supabase = getSupabase()
    const token    = `grp_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`

    const { data: firstEvent } = await supabase
      .from('events').select('id').order('event_date').limit(1).single()

    const { data: newGroup, error } = await supabase.from('groups').insert({
      teacher_id:         user.id,
      school_name:        profile?.name ?? 'Mon établissement',
      fair_id:            firstEvent?.id ?? '',
      invite_link:        token,
      invite_link_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      member_uids:        [],
    }).select().single()

    if (error) { toast('Erreur lors de la création du groupe', 'error'); return }
    setGroup(newGroup)
    toast('✓ Groupe créé — partagez le lien à vos élèves dès maintenant', 'success')
  }

  // ── Copy link ────────────────────────────────────────────────────────────────
  const inviteUrl = group
    ? (typeof window !== 'undefined' ? `${window.location.origin}/group-invite/${group.invite_link}` : `/group-invite/${group.invite_link}`)
    : ''

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setInviteCopied(true)
      toast('✓ Lien copié', 'success')
      setTimeout(() => setInviteCopied(false), 2500)
    })
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `Bonjour ! Pour le salon de l'orientation, je vous invite à créer votre profil étudiant avant le salon. Ça prend 2 minutes et vous aurez votre QR code d'entrée : ${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  function shareEmail() {
    const subject = encodeURIComponent('Inscrivez-vous avant le salon — 2 minutes')
    const body = encodeURIComponent(
      `Bonjour,\n\nPour le prochain salon de l'orientation, merci de créer votre profil étudiant avant votre venue.\n\nCela prend moins de 2 minutes et vous obtiendrez votre QR code d'entrée personnel.\n\nLien d'inscription : ${inviteUrl}\n\nÀ bientôt !`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalJoined   = members.length
  const preFairCount  = members.filter(m => m.pre_fair).length
  const withProfile   = members.filter(m => m.has_profile).length
  const preFairRate   = totalJoined ? Math.round((preFairCount / totalJoined) * 100) : 0

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="le-fade-in" style={{ flex: 1, padding: '32px 40px', maxWidth: 1000, fontFamily: 'system-ui, sans-serif' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(236,31,39,0.08)', color: '#EC1F27', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EC1F27', animation: 'lePulseDot 1.8s var(--ease-smooth) infinite' }} />
            Collecte de données · 2026
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1A1A1A' }}>
            Groupe scolaire
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: '16px', color: '#6B6B6B', lineHeight: 1.6, maxWidth: 600 }}>
            Collectez les profils de <strong style={{ color: '#1A1A1A' }}>chaque élève</strong> — idéalement avant le salon. Les groupes scolaires représentent ~15 % des 700 000 visiteurs annuels.
          </p>

          {/* Feature pills */}
          <div className="le-feature-grid">
            {[
              { icon: 'qr' as IconName, label: 'QR code groupe' },
              { icon: 'users' as IconName, label: 'Profils élèves' },
              { icon: 'chart' as IconName, label: 'Statistiques' },
              { icon: 'share' as IconName, label: 'Partage facile' },
            ].map(f => (
              <div key={f.label} className="le-feature-pill">
                <Icon name={f.icon} size={16} style={{ color: '#EC1F27' }} />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[1,2,3].map(i => <Skeleton key={i} variant="kpi" />)}
          </div>

        ) : !group ? (
          /* ── No group yet ─────────────────────────────────────────────── */
          <div>
            {/* Why this matters */}
            <div style={{ background: 'linear-gradient(135deg, rgba(0,102,204,0.95) 0%, rgba(0,86,204,0.93) 100%)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', color: '#fff', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,102,204,0.15)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>Pourquoi collecter ces données ?</p>
              <p style={{ margin: '0 0 12px', fontSize: '1.0625rem', fontWeight: 800, lineHeight: 1.3 }}>
                Sur 700 000 visiteurs / an, les groupes scolaires arrivent en anonymes
              </p>
              <ul style={{ margin: '0 0 4px', padding: '0 0 0 18px', fontSize: '0.875rem', opacity: 0.95, lineHeight: 1.8 }}>
                <li>Avant votre groupe : l&apos;enseignant inscrit son nom et le nombre d&apos;élèves</li>
                <li>Résultat : des données inutilisables pour L&apos;Étudiant et ses partenaires</li>
                <li>Avec ce dispositif : chaque élève crée son profil → QR individuel → données riches</li>
              </ul>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <EmptyState
                icon={<Icon name="scan" size={48} strokeWidth={1.5} />}
                title="Créez votre groupe pour commencer la collecte"
                description="Un lien + un QR code que vous partagez à vos élèves. En 2 minutes chacun a son profil et son QR d'entrée."
                action={{ label: 'Créer mon groupe →', onClick: createGroup }}
              />
            </div>
          </div>

        ) : (
          <>
            {/* ── KPIs ────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Élèves inscrits" value={totalJoined}     sub="profils collectés"        color="#EC1F27" />
              <StatCard label="Avant le salon"  value={`${preFairRate}%`} sub={`${preFairCount} élèves pré-inscrits`} color="#0066CC" />
              <StatCard label="Profil complet"  value={withProfile}     sub="niveau d'études renseigné" color="#15803d" />
            </div>

            {/* ── Progress bar: pre-fair registrations ─────────────────────── */}
            <div className="le-dash-card" style={{ padding: '20px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A' }}>Inscriptions avant le salon</span>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: preFairRate >= 70 ? '#15803d' : '#EC1F27' }}>{preFairCount} / {totalJoined}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(16,24,40,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${preFairRate}%`,
                  background: preFairRate >= 70
                    ? 'linear-gradient(90deg, #22c55e 0%, #15803d 100%)'
                    : 'linear-gradient(90deg, #EC1F27 0%, #C41520 100%)',
                  borderRadius: 999, transition: 'width 0.6s var(--ease-out)',
                }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#6B6B6B' }}>
                {preFairRate >= 70
                  ? '✓ Excellent taux — la plupart de vos élèves ont un profil complet !'
                  : <><Icon name="lightbulb" size={14} style={{ color: '#FCD716', marginRight: 4 }} /> Relancez les élèves manquants via le lien ci-dessous.</>}
              </p>
            </div>

            {/* ── Tabs: pre-fair actions vs member list ────────────────────── */}
            <div style={{ display: 'inline-flex', background: 'rgba(16,24,40,0.04)', borderRadius: 'var(--radius-lg)', padding: 6, marginBottom: 20, gap: 6, border: '1px solid rgba(16,24,40,0.08)' }}>
              {([['prefair', 'share' as IconName, 'Partager le lien'], ['members', 'users' as IconName, `Élèves (${totalJoined})`]] as const).map(([tab, iconName, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="le-tab-pill"
                  style={{
                    padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: activeTab === tab ? '#fff' : 'transparent',
                    color: activeTab === tab ? '#1A1A1A' : '#6B6B6B',
                    boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--trans-fast)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Icon name={iconName} size={14} />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'prefair' && (
              /* ── Pre-fair: sharing panel ─────────────────────────────── */
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', alignItems: 'start' }}>

                {/* QR */}
                <div style={{ textAlign: 'center' }}>
                  <canvas ref={qrCanvasRef} style={{ borderRadius: 12, display: 'block' }} />
                  <p style={{ margin: '8px 0 0', fontSize: '0.6875rem', color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    QR Groupe
                  </p>
                </div>

                {/* Share options */}
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#1A1A1A' }}>
                    Partagez avant le salon
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.6 }}>
                    Envoyez ce lien à vos élèves <strong>maintenant</strong>. Chaque élève crée son profil en 2 minutes et reçoit son QR d&apos;entrée personnel.
                  </p>

                  {/* Link copy row */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: '#F7F7F7', borderRadius: 8, padding: '10px 12px', fontSize: '0.8125rem', color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inviteUrl}
                    </div>
                    <button
                      onClick={copyInvite}
                      style={{ background: inviteCopied ? '#22c55e' : '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0 }}
                    >
                      {inviteCopied ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>

                  {/* Share buttons */}
                  <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A1A' }}>Partager directement :</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={shareWhatsApp}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      <Icon name="message" size={18} /> WhatsApp
                    </button>
                    <button
                      onClick={shareEmail}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0066CC', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      <Icon name="mail" size={18} /> Email
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'members' && (
              /* ── Members list ───────────────────────────────────────── */
              <div className="le-dash-card" style={{ overflow: 'hidden', padding: 0 }}>

                {members.length === 0 ? (
                  <div style={{ padding: '40px 24px' }}>
                    <EmptyState
                      icon={<Icon name="graduation" size={48} strokeWidth={1.5} />}
                      title="Aucun élève inscrit pour l'instant"
                      description="Partagez le lien ou le QR pour que vos élèves créent leur profil."
                    />
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px 110px', gap: 12, padding: '10px 20px', background: 'linear-gradient(180deg, #FAFAF8 0%, #F4F3EE 100%)', borderBottom: '1px solid rgba(16,24,40,0.08)' }}>
                      {['Élève', 'Inscrit le', 'Avant salon', 'Profil'].map(h => (
                        <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                      ))}
                    </div>
                    {members.map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 140px 110px 110px', gap: 12,
                          padding: '12px 20px', alignItems: 'center',
                          borderBottom: idx < members.length - 1 ? '1px solid rgba(16,24,40,0.06)' : 'none',
                          background: !m.has_profile ? 'rgba(236,31,39,0.03)' : undefined,
                          transition: 'background var(--trans-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F0FF', color: '#0066CC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A1A1A' }}>{m.name}</span>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: '#4B4B4B' }}>
                          {new Date(m.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span>
                          {m.pre_fair
                            ? <span style={{ background: '#DCFCE7', color: '#15803d', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>✓ Avant</span>
                            : <span style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>Jour J</span>}
                        </span>
                        <span>
                          {m.has_profile
                            ? <span style={{ background: '#DCFCE7', color: '#15803d', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>Complet</span>
                            : <span style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>Incomplet</span>}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
    </main>
  )
}
