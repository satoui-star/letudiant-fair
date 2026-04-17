import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Fix admin@demo.fr metadata by directly updating auth.users
 * GET /api/admin/fix-metadata
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'auth' }
      }
    )

    // Query auth.users directly (service role bypasses RLS)
    const { data: users, error: listError } = await supabase
      .from('users')
      .select('id, email, raw_user_meta_data')
      .eq('email', 'admin@demo.fr')

    if (listError) {
      console.error('Query error:', listError)
      throw listError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'admin@demo.fr not found in auth.users' }, { status: 404 })
    }

    const adminUser = users[0]
    console.log('Found admin user:', adminUser)

    // Update raw_user_meta_data
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        raw_user_meta_data: {
          ...(adminUser.raw_user_meta_data || {}),
          role: 'admin',
        },
      })
      .eq('id', adminUser.id)
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Metadata updated for admin@demo.fr',
      user: updated?.[0],
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/fix-metadata]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
