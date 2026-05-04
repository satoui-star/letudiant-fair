import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Exhibitor registration endpoints.
 *
 * POST   /api/exhibitor/register  { eventId } → register school for a fair (idempotent)
 * DELETE /api/exhibitor/register  { eventId } → unregister (only if no QR generated yet)
 */

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function resolveSchool(userId: string) {
  const db = svc()
  const { data } = await db
    .from('schools')
    .select('id, name')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function POST(request: Request) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const eventId: string | null = body?.eventId ?? null
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const school = await resolveSchool(user.id)
    if (!school) return NextResponse.json({ error: 'No school linked to this account' }, { status: 404 })

    const db = svc()

    // Idempotent — return existing row if already registered
    const { data: existing } = await db
      .from('event_exhibitors')
      .select('id')
      .eq('school_id', school.id)
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, already_registered: true })
    }

    const { error } = await db.from('event_exhibitors').insert({
      school_id: school.id,
      event_id: eventId,
    })
    if (error) throw error

    return NextResponse.json({ success: true, already_registered: false })
  } catch (err: unknown) {
    console.error('[POST /api/exhibitor/register]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const eventId: string | null = body?.eventId ?? null
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const school = await resolveSchool(user.id)
    if (!school) return NextResponse.json({ error: 'No school linked to this account' }, { status: 404 })

    const db = svc()

    const { data: row } = await db
      .from('event_exhibitors')
      .select('id, qr_code')
      .eq('school_id', school.id)
      .eq('event_id', eventId)
      .maybeSingle()

    if (!row) return NextResponse.json({ error: 'Not registered for this event' }, { status: 404 })
    if (row.qr_code) {
      return NextResponse.json(
        { error: 'Impossible de se désinscrire après la génération du QR code' },
        { status: 409 }
      )
    }

    const { error } = await db
      .from('event_exhibitors')
      .delete()
      .eq('id', row.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/exhibitor/register]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
