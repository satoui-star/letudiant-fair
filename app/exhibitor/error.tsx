'use client'
import { useEffect } from 'react'
export default function ExhibitorError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Exhibitor Error]', error) }, [error])
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ fontWeight: 700, color: '#E3001B' }}>Erreur espace établissement</p>
      <p style={{ color: '#6B6B6B', fontSize: '0.875rem', marginBottom: 16 }}>{error.message}</p>
      <button onClick={reset} style={{ background: '#E3001B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Réessayer</button>
    </div>
  )
}
