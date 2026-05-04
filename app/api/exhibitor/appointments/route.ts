import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/exhibitor/appointments?eventId=<id>
 *
 * Returns appointments for the exhibitor's school, grouped by slot_time.
 * GDPR: no student PII — student_id is used only for anonymised labelling.
 *
 * Response:
 *   {
 *     school: { id, name },
 *     summary: { pending, confirmed, attended, cancelled },
 *     groups: SlotGroup[],   // appointments grouped by slot_time
 *     event: { id, name, event_date } | null
 *   }
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

export async function GET(request: Request) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    const school = await resolveSchool(user.id)
    if (!school) {
      return NextResponse.json({ error: 'No school linked to this account' }, { status: 404 })
    }

    const db = svc()

    // ── Fetch appointments for this school ────────────────────────────────────
    // Service role bypasses RLS so we can read all appointments for the school.
    // We deliberately exclude student_id from the select to enforce GDPR at the
    // query level — no PII ever leaves this function.
    let query = db
      .from('appointments')
      .select('id, slot_time, slot_duration, status, student_notes, created_at, event_id')
      .eq('school_id', school.id)
      .order('slot_time', { ascending: true })

    if (eventId) query = query.eq('event_id', eventId)

    const { data: rows, error } = await query
    if (error) throw error

    const appts = rows ?? []

    // ── Summary counts ────────────────────────────────────────────────────────
    const summary = {
      pending:   appts.filter(a => a.status === 'pending').length,
      confirmed: appts.filter(a => a.status === 'confirmed').length,
      attended:  appts.filter(a => a.status === 'attended').length,
      cancelled: appts.filter(a => a.status === 'cancelled').length,
    }

    // ── Group by slot_time ────────────────────────────────────────────────────
    // Each unique slot_time becomes one group. Appointments are anonymised
    // with a sequential label per group.
    const groupMap = new Map<string, typeof appts>()
    for (const a of appts) {
      const key = a.slot_time
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(a)
    }

    const groups = Array.from(groupMap.entries()).map(([slot_time, items]) => ({
      slot_time,
      total: items.length,
      pending:   items.filter(a => a.status === 'pending').length,
      confirmed: items.filter(a => a.status === 'confirmed').length,
      cancelled: items.filter(a => a.status === 'cancelled').length,
      appointments: items.map((a, i) => ({
        id:            a.id,
        label:         `Étudiant #${i + 1}`,
        status:        a.status,
        slot_duration: a.slot_duration,
        student_notes: a.student_notes ? '✓ note' : null, // presence only, not content
      })),
    }))

    // ── Resolve event name for display ────────────────────────────────────────
    let event = null
    if (eventId) {
      const { data: ev } = await db
        .from('events')
        .select('id, name, event_date')
        .eq('id', eventId)
        .maybeSingle()
      event = ev
    }

    return NextResponse.json({
      success: true,
      school: { id: school.id, name: school.name },
      summary,
      groups,
      event,
    })
  } catch (err: unknown) {
    console.error('[GET /api/exhibitor/appointments]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
