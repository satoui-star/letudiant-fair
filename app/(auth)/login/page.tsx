'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth'
import Logo from '@/components/ui/Logo'
import StripeRule from '@/components/ui/StripeRule'

export default function LoginPage() {
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
      await signInWithEmail(email, password)
      // Redirect based on role stored in users table
      const { getSupabase } = await import('@/lib/supabase/client')
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('role').eq('id', user.id).maybeSingle()
        const role = profile?.role ?? user.user_metadata?.role ?? 'student'
        if (role === 'teacher')   { router.push('/teacher/dashboard'); return }
        if (role === 'exhibitor') { router.push('/exhibitor/dashboard'); return }
        if (role === 'admin')     { router.push('/admin/dashboard'); return }
        if (role === 'parent')    { router.push('/parent/home'); return }
      }
      router.push('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion Google')
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

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-le-gray-200 rounded-xl px-4 py-3 text-le-gray-700 font-medium hover:bg-le-gray-50 transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-le-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs text-le-gray-400 bg-white px-2">
              ou avec votre email
            </div>
          </div>

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
              <a href="/onboarding?role=student" style={{ display: 'block', padding: '10px 16px', background: '#E3001B', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                Créer mon espace étudiant
              </a>
              <a href="/onboarding?role=teacher" style={{ display: 'block', padding: '10px 16px', background: '#003C8F', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                Espace enseignant →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
