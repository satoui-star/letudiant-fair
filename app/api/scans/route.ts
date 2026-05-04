import { createServerSupabaseClient } from '@/lib/supabase/server'
import { computeIntentScore, computeIntentLevel } from '@/lib/scoring/intentScore'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { eventId, standId, sessionId, channel } = body

  // ── Resolve school_id from the scanned id ──
  // The QR can carry either a stand UUID or a school UUID. The exhibitor
  // dashboard generates QRs with schoolId, so we try to look that up and
  // also keep a denormalized school_id on the scan row for the dashboard.
  let resolvedSchoolId: string | null = null
  let resolvedStandId: string | null = null
  if (standId) {
    // Try as a school UUID first (exhibitor dashboard payload)
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('id', standId)
      .maybeSingle()
    if (school) {
      resolvedSchoolId = school.id
      // Find the matching stand for this school+event (if any)
      const { data: stand } = await supabase
        .from('stands')
        .select('id')
        .eq('school_id', school.id)
        .eq('event_id', eventId)
        .maybeSingle()
      resolvedStandId = stand?.id ?? null
    } else {
      // Fallback: treat as stand UUID
      const { data: stand } = await supabase
        .from('stands')
        .select('id, school_id')
        .eq('id', standId)
        .maybeSingle()
      if (stand) {
        resolvedStandId = stand.id
        resolvedSchoolId = stand.school_id
      }
    }
  }

  // ── Compute dwell for the previous scan (time between consecutive scans, capped at 20 min) ──
  const { data: prevScan } = await supabase
    .from('scans')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (prevScan) {
    const prevMs = new Date(prevScan.created_at).getTime()
    const dwellSeconds = Math.min(Math.round((Date.now() - prevMs) / 1000), 1200)
    await supabase
      .from('scans')
      .update({ dwell_seconds: dwellSeconds })
      .eq('id', prevScan.id)
      .catch((err: Error) => console.error('[scans] dwell update failed:', err))
  }

  // ── Insert new scan (dwell_seconds filled when next scan arrives) ────────────
  const insertPayload: Record<string, unknown> = {
    user_id:      user.id,
    event_id:     eventId,
    stand_id:     resolvedStandId,
    session_id:   sessionId ?? null,
    channel,
    dwell_seconds: null,
  }
  // Add school_id column denormalized (used by exhibitor dashboard queries)
  if (resolvedSchoolId) insertPayload.school_id = resolvedSchoolId

  const { data, error } = await supabase
    .from('scans')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── On entry scan: confirm all pending appointments for this event ───────────
  if (channel === 'entry' && eventId) {
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('student_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .catch((err: Error) => console.error('[scans] appointment confirm failed:', err))
  }

  // ── Refresh intent score after stand / conference / exit scans ───────────────
  if (channel === 'stand' || channel === 'conference' || channel === 'exit') {
    refreshIntentScoreServer(user.id, supabase).catch(err =>
      console.error('[scans] refreshIntentScore failed:', err)
    )
  }

  return NextResponse.json({ scanId: data?.id ?? '' })
}

// ─── Server-side intent score refresh ────────────────────────────────────────
async function refreshIntentScoreServer(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const [userRes, scansRes, matchesRes, appointmentsRes] = await Promise.all([
    supabase.from('users').select('email, education_level').eq('id', userId).single(),
    supabase.from('scans').select('channel').eq('user_id', userId),
    supabase.from('matches').select('student_swipe').eq('student_id', userId),
    supabase.from('appointments').select('id').eq('student_id', userId).neq('status', 'cancelled').limit(1),
  ])

  const u       = userRes.data
  const scans   = scansRes.data ?? []
  const matches = matchesRes.data ?? []

  const score = computeIntentScore({
    hasEducationLevel: !!u?.education_level,
    hasRealEmail:      !!u?.email && !u.email.includes('@group.letudiant-salons.fr') && !u.email.includes('@booth.letudiant-salons.fr'),
    standScanCount:    scans.filter((s: { channel: string }) => s.channel === 'stand').length,
    swipeRightCount:   matches.filter((m: { student_swipe: string }) => m.student_swipe === 'right').length,
    appointmentBooked: (appointmentsRes.data?.length ?? 0) > 0,
    conferenceCount:   scans.filter((s: { channel: string }) => s.channel === 'conference').length,
  })

  await supabase
    .from('users')
    .update({ intent_score: score, intent_level: computeIntentLevel(score) })
    .eq('id', userId)
}
