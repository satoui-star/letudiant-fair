import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from './server'

/**
 * Verify that the caller is an authenticated admin.
 *
 * Usage inside a Route Handler:
 *   const guard = await requireAdmin()
 *   if (guard.error) return guard.error
 *   // guard.userId is safe to use
 *
 * Returns either:
 *   { error: NextResponse }       → 401/403 to return immediately
 *   { userId: string }            → authorized admin
 */
export async function requireAdmin(): Promise<
  | { error: NextResponse; userId?: never }
  | { error?: never; userId: string }
> {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    // Authoritative source: public.users.role. Fall back to JWT metadata if
    // RLS blocks the lookup.
    let role = (user.user_metadata?.role ?? null) as string | null

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role) role = profile.role

    if (role !== 'admin') {
      return {
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      }
    }

    return { userId: user.id }
  } catch (err) {
    console.error('[requireAdmin]', err)
    return {
      error: NextResponse.json({ error: 'Server error' }, { status: 500 }),
    }
  }
}
