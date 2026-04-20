'use client'
export const dynamic = 'force-dynamic'

/**
 * Teacher — Students page
 *
 * Teachers see LOGISTICS ONLY:
 *   - Who registered (name, date)
 *   - Whether they checked in at the fair (entry scan)
 *
 * Teachers do NOT see:
 *   - Education level / bac series / interests (student personal data)
 *   - Stand visits, dwell time, top schools (behavioral data — L'Étudiant only)
 *
 * This is intentional: teacher role = logistics, not data access.
 */

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import Tag from '@/components/ui/Tag'

interface StudentLogistic {
  id:           string
  name:         string
  registered_at: string
  checked_in:   boolean   // has an entry scan for the group's fair
}

export default function TeacherStudentsPage() {
  const { user }                  = useAuth()
  const [students, setStudents]   = useState<StudentLogistic[]>([])
  const [loading,  setLoading]    = useState(true)
  const [fairId,   setFairId]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = getSupabase()

      // Get teacher's group
      const { data: group } = await supabase
        .from('groups')
        .select('member_uids, fair_id')
        .eq('teacher_id', user!.id)
        .maybeSingle()

      if (!group?.member_uids?.length) { setLoading(false); return }

      setFairId(group.fair_id)

      // Fetch only logistics fields — name and created_at
      const { data: members } = await supabase
        .from('users')
        .select('id, name, created_at')
        .in('id', group.member_uids)
        .order('created_at', { ascending: false })

      if (!members?.length) { setLoading(false); return }

      // Fetch entry scans for this fair
      const { data: entryScans } = await supabase
        .from('scans')
        .select('user_id')
        .eq('event_id', group.fair_id)
        .eq('channel', 'entry')
        .in('user_id', group.member_uids)

      const checkedInSet = new Set((entryScans ?? []).map(s => s.user_id))

      setStudents(
        members.map(m => ({
          id:            m.id,
          name:          m.name,
          registered_at: m.created_at,
          checked_in:    checkedInSet.has(m.id),
        }))
      )

      setLoading(false)
    }
    load()
  }, [user])

  const totalRegistered = students.length
  const totalCheckedIn  = students.filter(s => s.checked_in).length

  return (
    <main style={{ flex: 1, padding: '32px 28px', maxWidth: 900, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>Mes élèves</h1>
        <p style={{ margin: '0 0 28px', color: '#6B6B6B', fontSize: '0.9rem' }}>
          Suivi des inscriptions — données logistiques uniquement
        </p>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Inscrits via le groupe', value: totalRegistered, color: '#0066CC' },
            { label: 'Présents au salon',       value: totalCheckedIn,  color: '#22c55e' },
            { label: 'Non encore présents',     value: totalRegistered - totalCheckedIn, color: '#f59e0b' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div style={{ background: '#E6F0FF', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#0066CC', lineHeight: 1.6 }}>
            <strong>Données visibles ici :</strong> inscriptions et présence physique au salon.<br />
            Les parcours de visite, intérêts et données de navigation de vos élèves sont confidentiels et réservés à L&apos;Étudiant.
          </p>
        </div>

        {/* Student list */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 12, padding: '12px 20px', background: '#F4F4F4', borderBottom: '1px solid #E8E8E8' }}>
            {['', 'Élève', 'Inscription', 'Présence'].map(h => (
              <span key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} style={{ height: 48 }} />)}
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: 40 }}>
              <EmptyState icon="🧑‍🎓" title="Aucun élève inscrit" description="Partagez le QR code ou le lien d'invitation depuis l'onglet Mon groupe." />
            </div>
          ) : (
            students.map((s, i) => (
              <div
                key={s.id}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 12, padding: '13px 20px', borderBottom: i < students.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}
              >
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F0FF', color: '#0066CC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700 }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1A1A1A' }}>{s.name}</p>

                {/* Date inscrit */}
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9B9B9B', whiteSpace: 'nowrap' }}>
                  {new Date(s.registered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Présence */}
                {s.checked_in
                  ? <Tag variant="blue">✓ Présent</Tag>
                  : <Tag variant="gray">—</Tag>}
              </div>
            ))
          )}
        </div>
    </main>
  )
}
