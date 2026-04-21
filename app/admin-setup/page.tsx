'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const C = {
  tomate: '#EC1F27',
  piscine: '#003C8F',
  citron: '#FFD100',
  blanc: '#F8F7F2',
  nuit: '#191829',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

export default function AdminSetupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validateForm(): string | null {
    if (!firstName.trim()) return 'Prénom requis'
    if (!lastName.trim()) return 'Nom requis'
    if (!email.includes('@')) return 'Email invalide'
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères'
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          firstName,
          lastName,
          role: 'admin',
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de la création du compte administrateur')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.blanc, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <Logo variant="default" size="sm" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: C.nuit }}>
            Configuration Admin
          </h1>
          <p style={{ fontSize: 13, color: C.gray500, margin: 0 }}>
            Créez le compte administrateur initial
          </p>
        </div>

        {/* Success state */}
        {success && (
          <div style={{ background: '#D1FAE5', border: '1px solid #10B981', borderRadius: 8, padding: 16, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#065F46', fontSize: 13 }}>
              ✓ Compte administrateur créé avec succès.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#047857' }}>
              Redirection en cours…
            </p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ padding: 12, background: '#FDEAEA', border: `1.5px solid ${C.tomate}`, borderLeft: `6px solid ${C.tomate}`, borderRadius: 6, color: C.tomate, fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.nuit, marginBottom: 8 }}>
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, color: C.nuit, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.nuit, marginBottom: 8 }}>
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, color: C.nuit, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.nuit, marginBottom: 8 }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemple.fr"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, color: C.nuit, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.nuit, marginBottom: 8 }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, color: C.nuit, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.nuit, marginBottom: 8 }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, color: C.nuit, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: loading ? C.gray300 : C.nuit,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = C.tomate
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = C.nuit
              }}
            >
              {loading ? 'Création en cours…' : 'Créer le compte administrateur'}
            </button>
          </form>
        )}

        {/* Footer link */}
        {!success && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.gray500 }}>
            <a href="/" style={{ color: C.tomate, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ← Retour à l&apos;accueil
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
