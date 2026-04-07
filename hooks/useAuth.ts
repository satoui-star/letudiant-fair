'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRow } from '@/lib/supabase/types'

export interface AuthState {
  user: User | null
  profile: UserRow | null
  loading: boolean
  role: UserRow['role'] | null
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  return { user, profile, loading, role: profile?.role ?? null }
}
