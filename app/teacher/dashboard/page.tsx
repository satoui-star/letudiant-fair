'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toaster'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import TeacherSideNav from '@/components/layouts/TeacherSideNav'
import type { GroupRow, UserRow } from '@/lib/supabase/types'

export default function TeacherDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [group, setGroup] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()
      const { data: groupData } = await supabase
        .from('groups').select('*').eq('teacher_id', user!.id).maybeSingle()
      setGroup(groupData)

      if (groupData?.member_uids?.length) {
        const { data: membersData } = await supabase
          .from('users').select('*').in('id', groupData.member_uids)
        setMembers(membersData ?? [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function createGroup() {
    if (!user) return
    const supabase = getSupabase()
    const token = `grp_${Math.random().toString(36).slice(2, 10)}`
    const { data: firstEvent } = await supabase.from('events').select('id').order('event_date').limit(1).single()
    const { data: newGroup } = await supabase.from('groups').insert({
      teacher_id: user.id,
      school_name: profile?.name ?? 'Mon établissement',
      fair_id: firstEvent?.id ?? '',
      invite_link: token,
      invite_link_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      member_uids: [],
    }).select().single()
    setGroup(newGroup)
    toast('✓ Groupe créé avec succès', 'success')
  }

  function copyInvite() {
    if (!group) return
    const url = `${window.location.origin}/group-invite/${group.invite_link}`
    navigator.clipboard.writeText(url)
    setInviteCopied(true)
    toast('✓ Lien copié dans le presse-papiers', 'success')
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const registered = members.length
  const withProfile = members.filter(m => m.education_level).length
  const registrationRate = group?.member_uids?.length ? Math.round((registered / group.member_uids.length) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      <TeacherSideNav />
      <main style={{ flex: 1, padding: '32px 28px', marginLeft: 220 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>Mon groupe</h1>
        <p style={{ margin: '0 0 28px', color: '#6B6B6B', fontSize: '0.9rem' }}>
          {profile?.name ?? 'Enseignant'} · {group ? group.school_name : 'Aucun groupe'}
        </p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[1,2,3].map(i => <Skeleton key={i} variant="kpi" />)}
          </div>
        ) : !group ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <EmptyState icon="👩‍🏫" title="Aucun groupe créé" description="Créez un groupe pour inviter vos élèves et suivre leur engagement au salon." action={{ label: 'Créer mon groupe', onClick: createGroup }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Membres inscrits', value: registered, total: group.member_uids?.length ?? 0, color: '#22c55e' },
                { label: 'Profils complétés', value: withProfile, total: registered, color: '#003C8F' },
                { label: 'Taux d\'inscription', value: `${registrationRate}%`, color: '#E3001B' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                  <p style={{ margin: '0 0 3px', fontSize: '1.75rem', fontWeight: 800, color: k.color }}>{k.value}</p>
                  {k.total !== undefined && <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>sur {k.total}</p>}
                </div>
              ))}
            </div>

            {/* Invite link */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>Lien d&apos;invitation</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, background: '#F7F7F7', borderRadius: 10, padding: '10px 14px', fontSize: '0.8125rem', color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/group-invite/${group.invite_link}` : `…/group-invite/${group.invite_link}`}
                </div>
                <button onClick={copyInvite} style={{ background: inviteCopied ? '#22c55e' : '#E3001B', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0 }}>
                  {inviteCopied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Members list */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.9375rem', fontWeight: 700 }}>Membres du groupe ({members.length})</h3>
              {members.length === 0 ? (
                <EmptyState icon="🧑‍🎓" title="Aucun élève encore" description="Partagez le lien d'invitation pour que vos élèves rejoignent le groupe." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {members.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAFAFA', borderRadius: 10 }}>
                      <div>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', color: '#1A1A1A' }}>{m.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{m.education_level ?? 'Profil incomplet'} · {m.orientation_stage}</p>
                      </div>
                      <span style={{
                        background: m.orientation_stage === 'deciding' ? '#DCFCE7' : m.orientation_stage === 'comparing' ? '#FEF9C3' : '#EFF6FF',
                        color: m.orientation_stage === 'deciding' ? '#15803d' : m.orientation_stage === 'comparing' ? '#92400e' : '#1d4ed8',
                        borderRadius: 8, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600
                      }}>
                        {m.orientation_stage === 'deciding' ? '🟢' : m.orientation_stage === 'comparing' ? '🟡' : '🔵'} {m.orientation_stage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
