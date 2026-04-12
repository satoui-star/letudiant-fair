'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toaster'
import { Skeleton } from '@/components/ui/Skeleton'
import SectionLabel from '@/components/ui/SectionLabel'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

interface Member {
  id: string
  name: string
  joined_at: string
  education_level: string | null
  bac_series: string | null
}

type FilterKey = 'all' | 'profile_complete' | 'profile_incomplete'

const AVATAR_COLORS = [
  '#003C8F', '#E3001B', '#FFD100', '#16A34A', '#7C3AED',
  '#0891B2', '#EA580C', '#BE185D',
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function AvatarCircle({ name, index }: { name: string; index: number }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const textColor = bg === '#FFD100' ? '#1A1A1A' : '#fff'
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{getInitials(name)}</span>
    </div>
  )
}

export default function TeacherGroup() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()

      // Find teacher's group
      const { data: groupData } = await supabase
        .from('groups')
        .select('name, member_uids')
        .eq('teacher_id', user!.id)
        .maybeSingle()

      if (!groupData) { setLoading(false); return }
      setGroupName(groupData.name ?? 'Mon Groupe')

      if (groupData.member_uids?.length) {
        // Only logistics fields — no behavioral data
        const { data: membersData } = await supabase
          .from('users')
          .select('id, name, created_at, education_level, bac_series')
          .in('id', groupData.member_uids)
          .order('created_at', { ascending: false })

        setMembers(
          (membersData ?? []).map(m => ({
            id:              m.id,
            name:            m.name,
            joined_at:       m.created_at,
            education_level: (m as any).education_level ?? null,
            bac_series:      (m as any).bac_series ?? null,
          }))
        )
      }

      setLoading(false)
    }
    load()
  }, [user])

  const profileComplete  = members.filter(m => !!m.education_level)
  const profileIncomplete = members.filter(m => !m.education_level)

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',              label: 'Tous',              count: members.length },
    { key: 'profile_complete', label: 'Profil renseigné',  count: profileComplete.length },
    { key: 'profile_incomplete', label: 'Profil incomplet', count: profileIncomplete.length },
  ]

  const filtered = activeFilter === 'profile_complete'
    ? profileComplete
    : activeFilter === 'profile_incomplete'
      ? profileIncomplete
      : members

  function handleRelancer() {
    toast('Rappel envoyé aux élèves sans profil renseigné.', 'success')
  }

  function handleExport() {
    // Build CSV of name + join date only — no behavioral data
    const rows = [['Nom', 'Date inscription'], ...members.map(m => [m.name, new Date(m.joined_at).toLocaleDateString('fr-FR')])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `groupe_${groupName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast('Export CSV téléchargé', 'success')
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <SectionLabel>Gestion du groupe</SectionLabel>
          <h1 className="le-h1" style={{ marginTop: 10 }}>
            {loading ? '…' : groupName || 'Mon Groupe'}
          </h1>
          <p className="le-body" style={{ marginTop: 4 }}>
            {loading ? '' : `${members.length} élève${members.length !== 1 ? 's' : ''} inscrit${members.length !== 1 ? 's' : ''} via QR`}
          </p>
        </div>
        {!loading && <Tag variant="blue">{members.length} élève{members.length !== 1 ? 's' : ''}</Tag>}
      </div>

      {/* GDPR notice */}
      <div style={{ background: '#E6ECF8', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
        <p style={{ margin: 0, fontSize: 13, color: '#003C8F', lineHeight: 1.5 }}>
          <strong>Données affichées : nom + date d&apos;inscription uniquement.</strong><br />
          Les données comportementales (stands visités, swipes, scores) sont confidentielles et réservées à L&apos;Étudiant.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={56} borderRadius={8} />)}
        </div>
      ) : members.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>👥</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A', margin: '0 0 6px' }}>Aucun élève inscrit</p>
          <p style={{ fontSize: 13, color: '#6B6B6B', margin: '0 0 20px' }}>
            Partagez le QR code du groupe pour que vos élèves s&apos;inscrivent.
          </p>
          <Button variant="primary" href="/teacher/dashboard">Voir mon QR code →</Button>
        </div>
      ) : (
        <>
          {/* Actions bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4, background: '#E8E8E8', borderRadius: 8, padding: 4 }} role="tablist">
              {filters.map(f => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={activeFilter === f.key}
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: activeFilter === f.key ? '#fff' : 'transparent',
                    color: activeFilter === f.key ? '#1A1A1A' : '#6B6B6B',
                    boxShadow: activeFilter === f.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="primary" size="sm" onClick={handleRelancer}>Relancer sans profil</Button>
              <Button variant="ghost" size="sm" onClick={handleExport}>Exporter CSV</Button>
            </div>
          </div>

          {/* Table */}
          <div className="le-card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 120px', gap: 12, padding: '12px 20px', background: '#F4F4F4', borderBottom: '1px solid #E8E8E8' }}>
              {['', 'Élève', 'Inscription', 'Profil'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B6B6B' }}>Aucun élève dans cette catégorie.</div>
            ) : (
              filtered.map((member, idx) => (
                <div
                  key={member.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 140px 120px', gap: 12,
                    padding: '14px 20px', alignItems: 'center',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #E8E8E8' : 'none',
                    background: !member.education_level ? 'rgba(227,0,27,0.02)' : undefined,
                  }}
                >
                  <AvatarCircle name={member.name} index={idx} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A', margin: '0 0 1px' }}>{member.name}</p>
                    <p style={{ fontSize: 12, color: '#6B6B6B', margin: 0 }}>
                      {member.education_level ?? 'Niveau non renseigné'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#4B4B4B', margin: 0 }}>
                      {new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div>
                    {member.education_level
                      ? <Tag variant="blue">Renseigné</Tag>
                      : <Tag variant="red">Incomplet</Tag>
                    }
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary footer */}
          <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Inscrits', count: members.length, color: 'var(--le-blue)' },
              { label: 'Profil renseigné', count: profileComplete.length, color: '#16A34A' },
              { label: 'Profil incomplet', count: profileIncomplete.length, color: '#E3001B' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#6B6B6B' }}>
                  <strong style={{ color: '#1A1A1A' }}>{item.count}</strong> / {members.length} {item.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
