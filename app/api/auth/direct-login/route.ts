import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Direct login: manually verify credentials and set session cookie
 * POST /api/auth/direct-login
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (email !== 'admin@demo.fr' || password !== 'admin123456') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Get the admin user to verify they exist
    const { data: adminRow } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@demo.fr')
      .single()

    if (!adminRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create a fake session token (in production, use real JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        sub: adminRow.id,
        email: adminRow.email,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
      })
    ).toString('base64')

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('sb-auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json({
      success: true,
      role: adminRow.role,
      user: {
        id: adminRow.id,
        email: adminRow.email,
      },
    })
  } catch (err: unknown) {
    console.error('[POST /api/auth/direct-login]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
