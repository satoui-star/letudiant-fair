'use client'
import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import StripeRule from '@/components/ui/StripeRule'

// Inner component uses useSearchParams — must be wrapped in <Suspense>
function LoginInner() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Use direct login endpoint (bypasses problematic Supabase auth)
      const res = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      // Redirect based on role
      const role = data.role ?? 'student'
      if (role === 'teacher')   { router.push('/teacher/dashboard'); return }
      if (role === 'exhibitor') { router.push('/exhibitor/dashboard'); return }
      if (role === 'admin')     { router.push('/admin/dashboard'); return }
      if (role === 'parent')    { router.push('/parent/home'); return }
      router.push('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StripeRule />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-le-gray-900 text-center mb-2">
            Bienvenue
          </h1>
          <p className="text-le-gray-500 text-center mb-8 text-sm">
            Connectez-vous à votre espace salon
          </p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-le-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-le-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-le-red"
                placeholder="prenom.nom@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-le-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-le-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-le-red"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-le-gray-500 mb-2">
              Pas encore de compte ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/register" style={{ display: 'block', padding: '10px 16px', background: '#E3001B', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                Créer mon espace étudiant
              </a>
              <a href="/register?role=teacher" style={{ display: 'block', padding: '10px 16px', background: '#003C8F', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                Espace enseignant →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div style={{ width: 36, height: 36, border: '3px solid #E3001B', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
