import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * One-time setup: adds admin role to admin@demo.fr user
 * GET /api/admin/setup
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Update public.users table to set role = 'admin' for admin@demo.fr
    // (public.users now has RLS disabled, so this works)
    const { data: result, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'admin@demo.fr')
      .select('id, email, role')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Admin role added to admin@demo.fr',
      user: result,
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/setup]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
