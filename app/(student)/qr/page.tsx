'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Button from '@/components/ui/Button';
import StripeRule from '@/components/ui/StripeRule';

const MOCK_USER_ID = 'student_emma_aubert_2026';

export default function QRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offline, setOffline] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      const timestamp = Date.now();
      const qrData = `${MOCK_USER_ID}_${timestamp}`;

      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1A1A1A',
              light: '#FFFFFF',
            },
          });
          setGenerated(true);

          // Store data URL for offline use
          const dataUrl = canvasRef.current.toDataURL('image/png');
          try {
            localStorage.setItem('qr_code_data_url', dataUrl);
            localStorage.setItem('qr_code_generated_at', new Date().toISOString());
          } catch {
            // localStorage may not be available
          }
        }
      } catch (err) {
        console.error('QR generation error:', err);
        // Fallback: try to load from localStorage
        try {
          const saved = localStorage.getItem('qr_code_data_url');
          if (saved && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx && canvasRef.current) {
                ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                setGenerated(true);
                setOffline(true);
              }
            };
            img.src = saved;
          }
        } catch {
          // ignore
        }
      }
    };

    generateQR();

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div
      className="page-with-nav"
      style={{ minHeight: '100vh', background: '#F4F4F4' }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #E8E8E8',
        }}
      >
        <h1 className="le-h2" style={{ margin: '0 0 4px' }}>Mon QR Code</h1>
        <p className="le-caption" style={{ margin: 0 }}>
          Présentez ce code à l&apos;entrée et aux stands
        </p>
      </div>

      <StripeRule />

      {/* QR Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 20px',
          gap: 24,
        }}
      >
        <div className="qr-wrapper">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{
              display: 'block',
              borderRadius: 8,
              opacity: generated ? 1 : 0.3,
            }}
          />
          {!generated && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: '#6B6B6B',
                fontWeight: 500,
              }}
            >
              Génération en cours…
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#E3001B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              EA
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#1A1A1A' }}>
                Emma Aubert
              </p>
              <p className="le-caption" style={{ margin: 0 }}>Terminale S • Lycée Henri IV, Paris</p>
            </div>
          </div>
        </div>

        {/* Offline indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 24,
            background: '#fff',
            border: '1px solid #E8E8E8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: offline ? '#F59E0B' : '#16A34A',
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${offline ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.2)'}`,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#3D3D3D' }}>
            {offline ? 'Mode hors connexion' : 'Disponible hors connexion'}
          </span>
        </div>

        {/* Instruction card */}
        <div
          className="le-card"
          style={{ width: '100%', maxWidth: 380, padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>ℹ️</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px', color: '#1A1A1A' }}>
                Comment utiliser votre QR Code
              </p>
              <ul
                className="le-body"
                style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.7 }}
              >
                <li>Présentez ce code à l&apos;entrée du salon</li>
                <li>Scannez-le aux stands qui vous intéressent</li>
                <li>Suivez votre parcours en temps réel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scanner button */}
        <Button
          variant="primary"
          href="/fair/fair-paris-2026/scan"
          style={{ width: '100%', maxWidth: 380, justifyContent: 'center' }}
        >
          <span style={{ fontSize: 18, marginRight: 4 }}>📷</span>
          Scanner un stand
        </Button>

        <p className="le-caption" style={{ textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          Votre QR est unique et lié à votre inscription. Ne le partagez pas.
        </p>
      </div>
    </div>
  );
}
