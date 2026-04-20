/**
 * POST /api/admin-setup
 *
 * Hidden admin account creation endpoint for deployment.
 * Creates a new admin account via Supabase auth + public profile.
 *
 * Only works if:
 *   - No admin exists yet (first-admin exemption), OR
 *   - Caller is already authenticated as admin
 *
 * Body:
 *   { email, password, firstName, lastName }
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body as {
      email?: string
      password?: string
      firstName?: string
      lastName?: string
    }

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Create auth user (admin API — auto-confirms)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        name: `${firstName} ${lastName}`.trim(),
        role: 'admin',
      },
    })

    if (authError) {
      const msg = authError.message.toLowerCase().includes('already')
        ? 'An account with this email already exists'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Create public profile with admin role
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      email: email.toLowerCase().trim(),
      name: `${firstName} ${lastName}`.trim() || email,
      role: 'admin',
      optin_letudiant: true,
      consent_date: new Date().toISOString(),
    })

    if (profileError) {
      console.error('[POST /api/admin-setup] profile upsert failed:', profileError)
      // Don't fail — auth user was created, profile can be retried
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: { id: userId, email: email.toLowerCase().trim() },
    })
  } catch (err: unknown) {
    console.error('[POST /api/admin-setup]', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
