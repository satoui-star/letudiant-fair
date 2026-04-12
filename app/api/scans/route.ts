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
  const { eventId, standId, sessionId, channel, dwellEstimate } = body

  // ── Exit scan: compute actual dwell from entry scan ──────────────────────────
  let computedDwell: number | null = dwellEstimate ?? null

  if (channel === 'exit') {
    const { data: entryScan } = await supabase
      .from('scans')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('channel', 'entry')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (entryScan) {
      const entryMs = new Date(entryScan.created_at).getTime()
      const exitMs  = Date.now()
      computedDwell = Math.round((exitMs - entryMs) / 60_000) // minutes
    }
  }

  // ── Insert scan ──────────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id:       user.id,
      event_id:      eventId,
      stand_id:      standId   ?? null,
      session_id:    sessionId ?? null,
      channel,
      dwell_estimate: computedDwell,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Persist dwell on user profile after exit scan ────────────────────────────
  if (channel === 'exit' && computedDwell !== null) {
    await supabase
      .from('users')
      .update({ last_dwell_minutes: computedDwell })
      .eq('id', user.id)
      .catch(err => console.error('[scans] dwell update failed:', err))
  }

  // ── Refresh intent score after stand / conference / exit scans ───────────────
  if (channel === 'stand' || channel === 'conference' || channel === 'exit') {
    refreshIntentScoreServer(user.id, supabase).catch(err =>
      console.error('[scans] refreshIntentScore failed:', err)
    )
  }

  return NextResponse.json({ scanId: data?.id ?? '', dwellMinutes: computedDwell })
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
