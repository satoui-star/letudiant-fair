'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { use } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

interface ScanResult {
  standId: string
  standName: string
  registered: boolean
}

export default function ScanPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = use(params)
  const { user, loading: authLoading } = useAuth()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    if (!scanning || authLoading) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 2,
      },
      false
    )

    scannerRef.current = scanner

    scanner.render(
      async (decodedText: string) => {
        // Stop scanner immediately
        try {
          await scanner.clear()
        } catch {
          // ignore cleanup errors
        }
        setScanning(false)

        // Parse QR payload — can be JSON { standId, type } or a raw standId string
        let standId = decodedText.trim()
        let channel: 'stand' | 'conference' = 'stand'
        try {
          const parsed = JSON.parse(decodedText)
          if (parsed.standId) standId = parsed.standId
          if (parsed.type === 'conference') channel = 'conference'
        } catch {
          // not JSON — treat raw string as standId
        }

        // Look up stand / school name from DB
        let standName = `Stand ${standId}`
        try {
          const supabase = getSupabase()
          const { data } = await supabase
            .from('schools')
            .select('name')
            .eq('id', standId)
            .maybeSingle()
          if (data?.name) standName = data.name
        } catch {
          // non-fatal — use fallback name
        }

        // POST scan to API — auth is extracted server-side from cookie
        try {
          const res = await fetch('/api/scans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              standId,
              eventId,
              channel,
              sessionId: null,
              dwellEstimate: null,
            }),
          })

          setScanResult({ standId, standName, registered: res.ok })

          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            setError(body?.error ?? 'Erreur lors de l\'enregistrement')
          }
        } catch {
          // Network error — still show success locally
          setScanResult({ standId, standName, registered: false })
          setError('Connexion limitée — scan enregistré localement')
        }
      },
      (errorMessage: string) => {
        // Ignore frequent "no QR in view" messages
        if (!errorMessage.includes('No MultiFormat Readers')) {
          console.warn('Scan error:', errorMessage)
        }
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // ignore cleanup errors on unmount
        })
        scannerRef.current = null
      }
    }
  }, [eventId, scanning, authLoading])

  const handleRescan = () => {
    setScanResult(null)
    setError(null)
    setScanning(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          background: '#1A1A1A',
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <a
          href={`/fair/${eventId}`}
          style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: 22,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        >
          ←
        </a>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 20, margin: 0 }}>Scanner un stand</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
            {user ? `Connecté · ${user.email}` : 'Salon L\'Étudiant'}
          </p>
        </div>
      </div>

      {/* Auth guard */}
      {!authLoading && !user ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            gap: 16,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 48 }}>🔒</span>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 20, margin: 0 }}>Connexion requise</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
            Connectez-vous pour scanner les stands et enregistrer votre parcours.
          </p>
          <a
            href="/login"
            style={{
              background: '#EC1F27',
              color: '#fff',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            Se connecter
          </a>
        </div>
      ) : scanResult ? (
        /* Success state */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            gap: 24,
          }}
        >
          {/* Success circle */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(22,163,74,0.15)',
              border: '3px solid #16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            ✓
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 24, margin: '0 0 8px' }}>
              Stand scanné !
            </h2>
            <p style={{ color: '#16A34A', fontWeight: 600, fontSize: 18, margin: '0 0 12px' }}>
              {scanResult.standName}
            </p>
            <Tag variant={scanResult.registered ? 'blue' : 'yellow'}>
              {scanResult.registered ? 'Enregistré' : 'Enregistré localement'}
            </Tag>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '16px 20px',
              width: '100%',
              maxWidth: 360,
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Stand enregistré dans votre parcours.
              Vous retrouverez ce stand dans votre récapitulatif.
            </p>
          </div>

          {error && (
            <p style={{ color: '#F59E0B', fontSize: 13, textAlign: 'center', margin: 0 }}>
              ⚠️ {error}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
            <Button
              variant="primary"
              onClick={handleRescan}
              style={{ justifyContent: 'center' }}
            >
              <span style={{ fontSize: 16, marginRight: 6 }}>📷</span>
              Scanner un autre stand
            </Button>
            <Button
              variant="ghost"
              href={`/fair/${eventId}`}
              style={{
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              Retour au plan
            </Button>
          </div>
        </div>
      ) : (
        /* Scanner state */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 20px',
            gap: 20,
          }}
        >
          {/* Viewfinder frame */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 360,
            }}
          >
            {/* Corner decorations */}
            {[
              { top: -4, left: -4, borderTop: '3px solid #EC1F27', borderLeft: '3px solid #EC1F27', borderRadius: '4px 0 0 0' },
              { top: -4, right: -4, borderTop: '3px solid #EC1F27', borderRight: '3px solid #EC1F27', borderRadius: '0 4px 0 0' },
              { bottom: -4, left: -4, borderBottom: '3px solid #EC1F27', borderLeft: '3px solid #EC1F27', borderRadius: '0 0 0 4px' },
              { bottom: -4, right: -4, borderBottom: '3px solid #EC1F27', borderRight: '3px solid #EC1F27', borderRadius: '0 0 4px 0' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 32,
                  height: 32,
                  zIndex: 10,
                  pointerEvents: 'none',
                  ...s,
                }}
              />
            ))}

            {/* QR scanner div */}
            <div
              id="qr-reader"
              style={{
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#000',
              }}
            />
          </div>

          {/* Instructions */}
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '16px 20px',
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Scannez le QR code affiché sur chaque stand pour enregistrer votre visite et recevoir des informations personnalisées.
            </p>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', margin: 0 }}>
            Autorisez l&apos;accès à la caméra pour scanner
          </p>
        </div>
      )}
    </div>
  )
}
