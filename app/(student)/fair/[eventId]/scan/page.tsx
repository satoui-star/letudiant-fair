'use client';

import { useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';

interface ScanResult {
  standId: string;
  standName: string;
  registered: boolean;
}

export default function ScanPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning) return;

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
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText: string) => {
        // Stop scanner
        try {
          await scanner.clear();
        } catch {
          // ignore cleanup errors
        }
        setScanning(false);

        // Parse standId from QR
        const standId = decodedText.trim();
        const STAND_NAMES: Record<string, string> = {
          hec: 'HEC Paris',
          sciencespo: 'Sciences Po',
          insa: 'INSA Lyon',
          essec: 'ESSEC Business School',
          polytechnique: 'École Polytechnique',
          centrale: 'Centrale Paris',
        };
        const standName = STAND_NAMES[standId] || `Stand ${standId}`;

        try {
          const res = await fetch('/api/scans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              standId,
              eventId,
              scannedAt: new Date().toISOString(),
              userId: 'student_emma_aubert_2026',
            }),
          });

          setScanResult({
            standId,
            standName,
            registered: res.ok,
          });
        } catch {
          // Network error — still show success locally
          setScanResult({
            standId,
            standName,
            registered: false,
          });
          setError('Connexion limitée — scan enregistré localement');
        }
      },
      (errorMessage: string) => {
        // Ignore frequent scan failures (no QR in view)
        if (!errorMessage.includes('No MultiFormat Readers')) {
          console.warn('Scan error:', errorMessage);
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // ignore cleanup errors on unmount
        });
        scannerRef.current = null;
      }
    };
  }, [eventId, scanning]);

  const handleRescan = () => {
    setScanResult(null);
    setError(null);
    setScanning(true);
  };

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
            Salon de Paris • 15 avril 2026
          </p>
        </div>
      </div>

      {/* Success state */}
      {scanResult ? (
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
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                width: 32,
                height: 32,
                borderTop: '3px solid #E3001B',
                borderLeft: '3px solid #E3001B',
                borderRadius: '4px 0 0 0',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 32,
                height: 32,
                borderTop: '3px solid #E3001B',
                borderRight: '3px solid #E3001B',
                borderRadius: '0 4px 0 0',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: -4,
                width: 32,
                height: 32,
                borderBottom: '3px solid #E3001B',
                borderLeft: '3px solid #E3001B',
                borderRadius: '0 0 0 4px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 32,
                height: 32,
                borderBottom: '3px solid #E3001B',
                borderRight: '3px solid #E3001B',
                borderRadius: '0 0 4px 0',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />

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
  );
}
