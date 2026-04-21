import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

/**
 * Promote a user to admin role in public.users.
 *   GET /api/admin/setup?email=<user-email>
 *
 * Caller must already be an admin (bootstrap the very first admin via the
 * Supabase console / SQL).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required query param: email' },
        { status: 400 },
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: result, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select('id, email, role')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Admin role granted to ${email}`,
      user: result,
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/setup]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    )
  }
}
