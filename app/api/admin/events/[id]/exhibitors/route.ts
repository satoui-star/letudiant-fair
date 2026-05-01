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
      .from('event_exhibitors')
      .select('id, event_id, school_id, schools(name), registered_at')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: (data || []).map((ex: any) => ({
        id: ex.id,
        event_id: ex.event_id,
        school_id: ex.school_id,
        school_name: ex.schools?.name || 'Unknown',
        registered_at: ex.registered_at,
      })),
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/events/[id]/exhibitors]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const { searchParams } = new URL(request.url)
    const exhibitorId = searchParams.get('exhibitor_id')
    if (!exhibitorId) return NextResponse.json({ error: 'Exhibitor ID required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase
      .from('event_exhibitors')
      .delete()
      .eq('id', exhibitorId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/admin/events/[id]/exhibitors]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
