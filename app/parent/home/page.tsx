'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StripeRule from '@/components/ui/StripeRule'
import Logo from '@/components/ui/Logo'

interface StudentProfile {
  name: string
  education_level: string | null
  bac_series: string | null
  education_branches: string[]
  intent_level: string
  intent_score: number
  wishlist: string[]
  last_dwell_minutes: number | null
}

const INTENT_LABEL: Record<string, string> = {
  low: 'Explorateur',
  medium: 'Comparateur',
  high: 'Décideur',
}
const INTENT_COLOR: Record<string, string> = {
  low: '#6B6B6B',
  medium: '#003C8F',
  high: '#E3001B',
}

export default function ParentHomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { getSupabase } = await import('@/lib/supabase/client')
        const supabase = getSupabase()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: parentProfile } = await supabase
          .from('users').select('role, email').eq('id', user.id).maybeSingle()
        if (!parentProfile || parentProfile.role !== 'parent') {
          router.push('/home'); return
        }

        const { data: student, error: err } = await supabase
          .from('users')
          .select('name, education_level, bac_series, education_branches, intent_level, intent_score, wishlist, last_dwell_minutes')
          .eq('parent_email', parentProfile.email)
          .maybeSingle()

        if (err) throw err
        if (!student) {
          setError("Aucun profil étudiant n'est lié à votre adresse email.")
          return
        }
        setProfile(student as StudentProfile)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-le-gray-500 text-sm">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StripeRule />
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="text-2xl font-bold text-le-gray-900 mb-1">Espace parent</h1>
        <p className="text-sm text-le-gray-500 mb-8">Suivez le parcours salon de votre enfant</p>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Student identity card */}
            <div className="bg-white border border-le-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-le-red-light flex items-center justify-center text-le-red font-bold text-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-le-gray-900">{profile.name}</div>
                  <div className="text-xs text-le-gray-500">
                    {profile.education_level ?? 'Niveau non renseigne'}
                    {profile.bac_series ? ` - ${profile.bac_series}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-le-gray-500">Stade d orientation</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: INTENT_COLOR[profile.intent_level] ?? '#6B6B6B' }}
                >
                  {INTENT_LABEL[profile.intent_level] ?? 'Explorateur'}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-le-gray-500 mb-1">
                  <span>Score d intention</span>
                  <span className="font-semibold">{profile.intent_score} / 100</span>
                </div>
                <div className="h-2 bg-le-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${profile.intent_score}%`, backgroundColor: INTENT_COLOR[profile.intent_level] ?? '#6B6B6B' }}
                  />
                </div>
              </div>
            </div>

            {profile.education_branches.length > 0 && (
              <div className="bg-white border border-le-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-le-gray-700 uppercase tracking-wider mb-3">Domaines d interet declares</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.education_branches.map(b => (
                    <span key={b} className="px-3 py-1 rounded-full text-xs font-semibold bg-le-blue-light text-le-blue">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.wishlist && profile.wishlist.length > 0 && (
              <div className="bg-white border border-le-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-le-gray-700 uppercase tracking-wider mb-3">Etablissements sauvegardes</h2>
                <div className="space-y-2">
                  {profile.wishlist.map((school, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-le-gray-700">
                      <span className="text-le-red">coeur</span>
                      {school}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.last_dwell_minutes != null && (
              <div className="bg-white border border-le-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-le-gray-700 uppercase tracking-wider mb-2">Temps passe au dernier salon</h2>
                <div className="text-3xl font-bold text-le-gray-900">
                  {Math.floor(profile.last_dwell_minutes / 60)}h{String(profile.last_dwell_minutes % 60).padStart(2, '0')}
                </div>
                <p className="text-xs text-le-gray-500 mt-1">Duree mesuree entre le scan d entree et le scan de sortie</p>
              </div>
            )}

            <div className="bg-le-gray-100 rounded-xl p-4 text-xs text-le-gray-500">
              <span className="font-semibold text-le-gray-700">Donnees affichees :</span>{' '}
              niveau, domaines d interet, etablissements sauvegardes et temps de presence au salon.
              Les donnees comportementales detaillees restent confidentielles.
            </div>

            <a
              href="/parent/orientation"
              className="block w-full text-center py-3 rounded-xl font-semibold text-sm"
              style={{ background: '#003C8F', color: '#fff' }}
            >
              Conseils orientation
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
