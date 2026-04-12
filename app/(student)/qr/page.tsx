'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '@/hooks/useAuth'
import { trackPageView } from '@/lib/analytics/track'
import { getIntentNudge } from '@/lib/scoring/intentScore'
import StudentBottomNav from '@/components/layouts/StudentBottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

const CACHE_KEY    = 'le_qr_cache'
const CACHE_UID    = 'le_qr_uid'

export default function QRPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const [qrReady,    setQrReady]    = useState(false)
  const [isOffline,  setIsOffline]  = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    trackPageView('student_qr')
    setIsOffline(!navigator.onLine)
    const onOffline = () => setIsOffline(true)
    const onOnline  = () => setIsOffline(false)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online',  onOnline)
    return () => { window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline) }
  }, [])

  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? 'anonymous'
    generateQR(userId)
    // Check if student has already scanned entry today
    if (user) checkEntryStatus(user.id)
  }, [user, authLoading])

  async function checkEntryStatus(userId: string) {
    try {
      const { getSupabase } = await import('@/lib/supabase/client')
      const supabase = getSupabase()
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('scans')
        .select('id')
        .eq('user_id', userId)
        .eq('channel', 'entry')
        .gte('created_at', today)
        .limit(1)
        .maybeSingle()
      setHasEntered(!!data)
    } catch { /* offline — silently skip */ }
  }

  async function generateQR(userId: string) {
    // ⚠️  Payload intentionally excludes timestamp — the QR must be STABLE.
    // Same user always shows the same QR. Fair staff scan this to confirm identity.
    const payload = JSON.stringify({ uid: userId, app: 'letudiant-salons' })

    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payload, {
          width: 260, margin: 2,
          color: { dark: '#1A1A1A', light: '#FFFFFF' },
        })
        // Cache for offline use — only re-cache if userId changed
        const cachedUid = localStorage.getItem(CACHE_UID)
        if (cachedUid !== userId) {
          localStorage.setItem(CACHE_UID,  userId)
          localStorage.setItem(CACHE_KEY,  canvasRef.current.toDataURL())
        }
        setQrReady(true)
      }
    } catch {
      // Offline or canvas error — load from cache if available
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached && canvasRef.current) {
        const img = new Image()
        img.onload = () => {
          const ctx = canvasRef.current!.getContext('2d')
          if (ctx) {
            canvasRef.current!.width  = img.width
            canvasRef.current!.height = img.height
            ctx.drawImage(img, 0, 0)
            setQrReady(true)
          }
        }
        img.src = cached
      }
    }
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Étudiant'
  const intentScore = (profile as any)?.intent_score ?? 0
  const nudge       = getIntentNudge(intentScore)

  const levelBg:    Record<string, string> = { low: '#EFF6FF', medium: '#FFFBE6', high: '#F0FFF4' }
  const levelColor: Record<string, string> = { low: '#1d4ed8', medium: '#92400e', high: '#15803d' }
  const levelLabel: Record<string, string> = { low: 'Démarrage', medium: 'En exploration', high: 'Très actif(ve)' }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 90, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#E3001B', padding: '52px 20px 24px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800 }}>Mon QR Code</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', opacity: 0.8 }}>
          Présente-le à l&apos;entrée et à chaque stand
        </p>
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* QR Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 28, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {authLoading ? (
            <Skeleton variant="card" style={{ width: 260, height: 260, margin: '0 auto 16px' }} />
          ) : (
            <canvas ref={canvasRef} style={{ borderRadius: 12, display: 'block', margin: '0 auto 16px', opacity: qrReady ? 1 : 0, transition: 'opacity 0.3s' }} />
          )}
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.0625rem', color: '#1A1A1A' }}>{firstName}</p>
          <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: '#6B6B6B' }}>
            {profile?.education_level ?? ''}{(profile as any)?.bac_series ? ` · Bac ${(profile as any).bac_series}` : ''}
          </p>
          {/* Entry status badge */}
          {!authLoading && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: hasEntered ? '#DCFCE7' : '#F4F4F4',
              color: hasEntered ? '#15803d' : '#6B6B6B',
              borderRadius: 20, padding: '5px 14px', fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasEntered ? '#22c55e' : '#D1D5DB', display: 'inline-block' }} />
              {hasEntered ? 'Entrée validée ✓' : 'Pas encore scanné à l\'entrée'}
            </div>
          )}
        </div>

        {/* Offline badge */}
        {isOffline && (
          <div style={{ background: '#FFF7E0', border: '1px solid #f59e0b', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>📡</span>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#92400e', fontWeight: 500 }}>Mode hors-ligne — QR code depuis le cache</p>
          </div>
        )}

        {/* Intent level nudge */}
        {!authLoading && (
          <div style={{ background: levelBg[nudge.level], borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: levelColor[nudge.level], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {levelLabel[nudge.level]}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: '#3D3D3D', lineHeight: 1.5 }}>{nudge.message}</p>
              {/* Progress bar */}
              <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${nudge.progressPercent}%`, background: levelColor[nudge.level], borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>Comment ça marche ?</h3>
          {[
            { step: '1', text: 'Présente ce QR code à l\'entrée du salon pour valider ton arrivée' },
            { step: '2', text: 'À chaque stand, scanne le QR du stand pour enregistrer ta visite' },
            { step: '3', text: 'Retrouve tout ton parcours dans ton Récap après le salon' },
            { step: '4', text: 'Scanne ton QR à la sortie pour valider ton temps passé au salon' },
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
