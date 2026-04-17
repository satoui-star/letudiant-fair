import { NextResponse } from 'next/server'

/**
 * Update admin@demo.fr metadata in auth.users via Supabase admin API
 * GET /api/admin/setup-auth
 */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Step 1: Get admin user ID
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

    const { users } = await listRes.json()
    const adminUser = users.find((u: any) => u.email === 'admin@demo.fr')

    if (!adminUser) {
      return NextResponse.json({ error: 'admin@demo.fr not found' }, { status: 404 })
    }

    console.log('Found admin user:', adminUser.id)

    // Step 2: Update metadata to add role: admin
    const updateRes = await fetch(`${url}/auth/v1/admin/users/${adminUser.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        apikey: key,
      },
      body: JSON.stringify({
        user_metadata: {
          role: 'admin',
        },
      }),
    })

    const updateText = await updateRes.text()
    console.log('Update response status:', updateRes.status, 'body:', updateText)

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateText}`)
    }

    const updated = JSON.parse(updateText)

    return NextResponse.json({
      success: true,
      message: 'Auth metadata updated for admin@demo.fr',
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
      { status: 500 }
    )
  }
}
