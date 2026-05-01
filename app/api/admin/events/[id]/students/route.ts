import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const eventId = params.id
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabase
      .from('event_students')
      .select('id, event_id, user_id, users(name), registered_at, scanned_entry, scanned_exit, entry_qr, exit_qr')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: (data || []).map((s: any) => ({
        id: s.id,
        event_id: s.event_id,
        user_id: s.user_id,
        user_name: s.users?.name || 'Unknown',
        registered_at: s.registered_at,
        scanned_entry: s.scanned_entry,
        scanned_exit: s.scanned_exit,
        entry_qr: s.entry_qr,
        exit_qr: s.exit_qr,
      })),
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/events/[id]/students]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
