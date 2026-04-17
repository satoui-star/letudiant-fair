'use client'
import { useEffect } from 'react'
export default function TeacherError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Teacher Error]', error) }, [error])
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ fontWeight: 700, color: '#EC1F27' }}>Erreur espace enseignant</p>
      <p style={{ color: '#6B6B6B', fontSize: '0.875rem', marginBottom: 16 }}>{error.message}</p>
      <button onClick={reset} style={{ background: '#EC1F27', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Réessayer</button>
    </div>
  )
}
