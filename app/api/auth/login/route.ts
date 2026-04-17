import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  try {
    // Use service role key — bypasses RLS entirely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Sign in via auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 })
    }

    // Get role from JWT user_metadata (no DB query needed)
    const role = data.user.user_metadata?.role ?? 'student'

    // Set auth cookies for the browser
    const cookieStore = await cookies()
    if (data.session) {
      cookieStore.set('sb-auth-token', data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return NextResponse.json({
      success: true,
      role,
      user: { id: data.user.id, email: data.user.email },
    })
  } catch (err: unknown) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
