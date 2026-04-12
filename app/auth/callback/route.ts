import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Route group (student) means the browser URL is /home, not /student/home
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // ── Resolve pre-registration if email matches ──────────────────────────
      // When a student who registered on letudiant.fr opens the app for the first time,
      // link their Eventmaker pre-registration to their auth account.
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const svc = await createServiceClient()
          await svc
            .from('pre_registrations')
            .update({ resolved_user_id: user.id, resolved_at: new Date().toISOString() })
            .eq('email', user.email.toLowerCase())
            .is('resolved_user_id', null)
        }
      } catch (e) {
        // Non-fatal — don't block the redirect
        console.error('[auth/callback] pre-registration resolve failed:', e)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
