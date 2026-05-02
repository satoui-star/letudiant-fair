import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Simple test - just count existing data
    const { count: salonCount } = await db.from('events').select('*', { count: 'exact', head: true })
    const { count: schoolCount } = await db.from('schools').select('*', { count: 'exact', head: true })
    const { count: progCount } = await db.from('event_programs').select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      current_counts: {
        salons: salonCount || 0,
        schools: schoolCount || 0,
        programs: progCount || 0,
      },
      message: 'Test successful - database is connected',
    })
  } catch (err: unknown) {
    console.error('Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error', success: false },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
