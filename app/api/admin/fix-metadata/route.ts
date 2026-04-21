import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

/**
 * Set role: admin in auth.users.raw_user_meta_data for a given user.
 *   GET /api/admin/fix-metadata?email=<user-email>
 *
 * Caller must already be admin.
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
      {
        auth: { persistSession: false },
        db: { schema: 'auth' },
      },
    )

    const { data: users, error: listError } = await supabase
      .from('users')
      .select('id, email, raw_user_meta_data')
      .eq('email', email)

    if (listError) {
      console.error('Query error:', listError)
      throw listError
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: `${email} not found in auth.users` },
        { status: 404 },
      )
    }

    const target = users[0]

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        raw_user_meta_data: {
          ...(target.raw_user_meta_data || {}),
          role: 'admin',
        },
      })
      .eq('id', target.id)
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: `Metadata updated for ${email}`,
      user: updated?.[0],
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/fix-metadata]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    )
  }
}
