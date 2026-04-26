'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface BoothData {
  schoolId: string
  schoolName: string
  coverImageUrl: string | null
  visitedAt: string
}

export default function BoothVisit({ eventId }: { eventId: string }) {
  const { user } = useAuth()
  const [booth, setBooth] = useState<BoothData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !eventId) {
      setLoading(false)
      return
    }

    const fetchBoothVisit = async () => {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('scans')
          .select(`
            created_at,
            stands(school_id),
            stands!inner(schools(id, name, cover_image_url))
          `)
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .eq('channel', 'entry')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error || !data) {
          setLoading(false)
          return
        }

        const school = data.stands?.schools as any
        setBooth({
          schoolId: school?.id,
          schoolName: school?.name || 'Unknown School',
          coverImageUrl: school?.cover_image_url,
          visitedAt: data.created_at,
        })
      } catch (err) {
        console.error('Error fetching booth visit:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBoothVisit()
  }, [user?.id, eventId])

  if (loading) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 120, background: '#f0f0f0', borderRadius: 12, animation: 'pulse 2s infinite' }} />
      </div>
    )
  }

  if (booth) {
    // Student has visited a booth
    const visitDate = new Date(booth.visitedAt).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          border: '1px solid #e8e8e8',
        }}
      >
        {/* Header with background */}
        <div
          style={{
            background: booth.coverImageUrl
              ? `linear-gradient(135deg, rgba(0,102,204,0.9), rgba(0,85,204,0.9)), url(${booth.coverImageUrl})`
              : 'linear-gradient(135deg, #0066CC, #0056CC)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '20px',
            color: '#fff',
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>
              STAND VISITÉ
            </p>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
              {booth.schoolName}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', opacity: 0.85 }}>
              Visité le {visitDate}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, background: '#fff' }}>
          <a
            href={`/schools/${booth.schoolId}`}
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0066CC',
              textDecoration: 'none',
              borderRight: '1px solid #e8e8e8',
              cursor: 'pointer',
            }}
          >
            👁️ Voir profil
          </a>
          <a
            href={`/schools/${booth.schoolId}#appointments`}
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0066CC',
              textDecoration: 'none',
              borderRight: '1px solid #e8e8e8',
              cursor: 'pointer',
            }}
          >
            📅 RDV
          </a>
          <button
            onClick={() => {
              // Save to wishlist — future implementation
              console.log('Save school to wishlist:', booth.schoolId)
            }}
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0066CC',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ❤️ Sauvegarder
          </button>
        </div>
      </div>
    )
  }

  // No booth visits yet
  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #E6F0FF, #F0F7FF)',
        border: '1.5px solid #0066CC',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: '1.5rem' }}>📱</p>
      <h3 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 700, color: '#1A1A1A' }}>
        Découvrez les stands du salon
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#6B6B6B', lineHeight: 1.5 }}>
        Scannez les QR codes des stands pour découvrir les écoles et suivre vos visites.
      </p>
      <a
        href="/schools"
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: '#0066CC',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 8,
          fontSize: '0.8125rem',
          fontWeight: 600,
        }}
      >
        Explorer les écoles →
      </a>
    </div>
  )
}
