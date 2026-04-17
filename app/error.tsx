'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Global Error]', error) }, [error])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A', margin: '16px 0 8px' }}>Quelque chose s&apos;est mal passé</h2>
      <p style={{ color: '#6B6B6B', fontSize: '0.9rem', textAlign: 'center', maxWidth: 320, marginBottom: 24 }}>
        Une erreur inattendue est survenue. Nos équipes ont été notifiées.
      </p>
      <button onClick={reset} style={{ background: '#EC1F27', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem' }}>
        Réessayer
      </button>
      <a href="/" style={{ marginTop: 12, color: '#6B6B6B', fontSize: '0.875rem', textDecoration: 'underline' }}>Retour à l&apos;accueil</a>
    </div>
  )
}
