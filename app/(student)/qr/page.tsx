'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '@/hooks/useAuth'
import { trackPageView } from '@/lib/analytics/track'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

const CACHE_KEY = 'le_qr_cache'

export default function QRPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    trackPageView('student_qr')
    setIsOffline(!navigator.onLine)
    window.addEventListener('offline', () => setIsOffline(true))
    window.addEventListener('online', () => setIsOffline(false))
  }, [])

  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? 'anonymous'
    generateQR(userId)
  }, [user, authLoading])

  async function generateQR(userId: string) {
    const payload = JSON.stringify({
      uid: userId,
      name: profile?.name ?? '',
      ts: Date.now(),
      app: 'letudiant-salons',
    })
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payload, {
          width: 260, margin: 2,
          color: { dark: '#1A1A1A', light: '#FFFFFF' },
        })
        const dataUrl = canvasRef.current.toDataURL()
        setQrDataUrl(dataUrl)
        localStorage.setItem(CACHE_KEY, dataUrl)
      }
    } catch {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) setQrDataUrl(cached)
    }
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Étudiant'
  const stage = profile?.orientation_stage ?? 'exploring'
  const stageLabel: Record<string, string> = { exploring: 'Exploration', comparing: 'Comparaison', deciding: 'Décision' }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 90, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#E3001B', padding: '52px 20px 24px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800 }}>Mon QR Code</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', opacity: 0.8 }}>Présentez-le à chaque stand pour enregistrer votre visite</p>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* QR Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 28, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          {authLoading ? (
            <Skeleton variant="card" style={{ width: 260, height: 260, margin: '0 auto 16px' }} />
          ) : (
            <canvas ref={canvasRef} style={{ borderRadius: 12, display: 'block', margin: '0 auto 16px' }} />
          )}
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.0625rem', color: '#1A1A1A' }}>{firstName}</p>
          <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: '#6B6B6B' }}>
            {profile?.education_level ?? ''}{profile?.bac_series ? ` · Bac ${profile.bac_series}` : ''}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5F5F5', borderRadius: 20, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#1A1A1A' }}>
            🎯 {stageLabel[stage]}
          </span>
        </div>

        {/* Offline badge */}
        {isOffline && (
          <div style={{ background: '#FFF7E0', border: '1px solid #f59e0b', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>📡</span>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#92400e', fontWeight: 500 }}>Mode hors-ligne — QR code depuis le cache</p>
          </div>
        )}

        {/* Instructions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>Comment ça marche ?</h3>
          {[
            { step: '1', text: 'Présentez ce QR code à l\'entrée du salon pour valider votre arrivée' },
            { step: '2', text: 'À chaque stand, laissez scanner pour enregistrer votre passage' },
            { step: '3', text: 'Retrouvez tous vos contacts dans votre Dossier après le salon' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ background: '#E3001B', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{s.step}</span>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4B4B4B', lineHeight: 1.5 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
      <StudentBottomNav />
    </div>
  )
}
