'use client'
import { useEffect } from 'react'

export default function StudentError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Student Error]', error) }, [error])
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h3 style={{ fontWeight: 700, margin: '12px 0 6px' }}>Erreur de chargement</h3>
      <p style={{ color: '#6B6B6B', fontSize: '0.875rem', textAlign: 'center', maxWidth: 280, marginBottom: 20 }}>
        Impossible de charger cette page. Vérifiez votre connexion.
      </p>
      <button onClick={reset} style={{ background: '#E3001B', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>Réessayer</button>
    </div>
  )
}
