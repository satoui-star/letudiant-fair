import { NextResponse } from 'next/server'

type AuthUser = { id: string; email: string; user_metadata?: Record<string, unknown> }

/**
 * Update a user's auth.users metadata to add role: admin.
 *   GET /api/admin/setup-auth?email=<user-email>
 *
 * The email is required — no more hardcoded demo account.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required query param: email' },
        { status: 400 },
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Step 1: locate the auth user by email
    const listRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    })

    if (!listRes.ok) {
      console.error('List failed:', await listRes.text())
      throw new Error('Failed to list users')
    }

    const { users } = (await listRes.json()) as { users: AuthUser[] }
    const target = users.find((u) => u.email?.toLowerCase() === email)

    if (!target) {
      return NextResponse.json({ error: `${email} not found` }, { status: 404 })
    }

    // Step 2: attach admin role in user_metadata
    const updateRes = await fetch(`${url}/auth/v1/admin/users/${target.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        apikey: key,
      },
      body: JSON.stringify({
        user_metadata: { role: 'admin' },
      }),
    })

    const updateText = await updateRes.text()
    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateText}`)
    }

    const updated = JSON.parse(updateText) as AuthUser

    return NextResponse.json({
      success: true,
      message: `Auth metadata updated for ${email}`,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.user_metadata?.role,
      },
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/setup-auth]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    )
  }
}
