import { getSupabase } from './client'
import type { UserRow, EventRow, SchoolRow, ScanRow, LeadRow, MatchRow, GroupRow, AppointmentRow } from './types'

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<UserRow | null> {
  const { data } = await getSupabase().from('users').select('*').eq('id', id).single()
  return data
}

export async function upsertUser(user: Partial<UserRow> & { id: string; email: string }): Promise<void> {
  await getSupabase().from('users').upsert({ ...user, updated_at: new Date().toISOString() })
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<EventRow[]> {
  const { data } = await getSupabase().from('events').select('*').order('event_date', { ascending: true })
  return data ?? []
}

export async function getEvent(id: string): Promise<EventRow | null> {
  const { data } = await getSupabase().from('events').select('*').eq('id', id).single()
  return data
}

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function getSchools(): Promise<SchoolRow[]> {
  const { data } = await getSupabase().from('schools').select('*').order('name')
  return data ?? []
}

export async function getSchool(id: string): Promise<SchoolRow | null> {
  const { data } = await getSupabase().from('schools').select('*').eq('id', id).single()
  return data
}

export async function getSchoolFormations(schoolId: string) {
  const { data } = await getSupabase().from('formations').select('*').eq('school_id', schoolId)
  return data ?? []
}

// ─── Stands ───────────────────────────────────────────────────────────────────

export async function getEventStands(eventId: string) {
  const { data } = await getSupabase()
    .from('stands')
    .select('*, schools(name, type, city)')
    .eq('event_id', eventId)
  return data ?? []
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getEventSessions(eventId: string) {
  const { data } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time')
  return data ?? []
}

// ─── Scans ────────────────────────────────────────────────────────────────────

export async function createScan(scan: Omit<ScanRow, 'id' | 'created_at'>): Promise<string> {
  const { data } = await getSupabase().from('scans').insert(scan).select('id').single()
  return data?.id ?? ''
}

export async function getUserScans(userId: string, eventId: string): Promise<ScanRow[]> {
  const { data } = await getSupabase()
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  return data ?? []
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeadsForSchool(schoolId: string): Promise<LeadRow[]> {
  const { data } = await getSupabase()
    .from('leads')
    .select('*, users(name, email, education_level)')
    .eq('school_id', schoolId)
    .order('score_value', { ascending: false })
  return data ?? []
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const { data } = await getSupabase().from('leads').select('*').eq('id', id).single()
  return data
}

export async function upsertLead(lead: Omit<LeadRow, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  await getSupabase().from('leads').upsert(lead)
}

export async function markLeadExported(id: string, by: string): Promise<void> {
  await getSupabase()
    .from('leads')
    .update({ exported_by: by, exported_at: new Date().toISOString() })
    .eq('id', id)
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function upsertMatch(match: Omit<MatchRow, 'id' | 'created_at'>): Promise<void> {
  await getSupabase()
    .from('matches')
    .upsert(match, { onConflict: 'student_id,school_id' })
}

export async function getMatchesForStudent(studentId: string): Promise<MatchRow[]> {
  const { data } = await getSupabase()
    .from('matches')
    .select('*, schools(name, city, type, cover_image_url)')
    .eq('student_id', studentId)
  return data ?? []
}

export async function getStudentRightSwipes(studentId: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from('matches')
    .select('school_id')
    .eq('student_id', studentId)
    .eq('student_swipe', 'right')
  return data?.map((m) => m.school_id) ?? []
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function getGroupByInviteLink(token: string): Promise<GroupRow | null> {
  const { data } = await getSupabase()
    .from('groups')
    .select('*')
    .eq('invite_link', token)
    .single()
  return data
}

export async function getGroupByTeacher(teacherId: string): Promise<GroupRow | null> {
  const { data } = await getSupabase()
    .from('groups')
    .select('*')
    .eq('teacher_id', teacherId)
    .single()
  return data
}

export async function addMemberToGroup(groupId: string, userId: string): Promise<void> {
  const group = await getSupabase().from('groups').select('member_uids').eq('id', groupId).single()
  const existing = group.data?.member_uids ?? []
  if (!existing.includes(userId)) {
    await getSupabase()
      .from('groups')
      .update({ member_uids: [...existing, userId] })
      .eq('id', groupId)
  }
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function bookAppointment(
  appointment: Pick<AppointmentRow, 'student_id' | 'school_id' | 'event_id' | 'slot_time' | 'student_notes'>
): Promise<AppointmentRow | null> {
  const { data } = await getSupabase()
    .from('appointments')
    .insert({ ...appointment, slot_duration: 15, status: 'pending' })
    .select()
    .single()
  return data
}

export async function cancelAppointment(id: string): Promise<void> {
  await getSupabase().from('appointments').update({ status: 'cancelled' }).eq('id', id)
}

export async function getAppointmentsForStudent(studentId: string, eventId: string): Promise<AppointmentRow[]> {
  const { data } = await getSupabase()
    .from('appointments')
    .select('*, schools(name, city, type)')
    .eq('student_id', studentId)
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('slot_time')
  return data ?? []
}

export async function getStudentAppointmentForSchool(
  studentId: string,
  schoolId: string,
  eventId: string
): Promise<AppointmentRow | null> {
  const { data } = await getSupabase()
    .from('appointments')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .maybeSingle()
  return data
}

// ─── Intent Level ─────────────────────────────────────────────────────────────

/**
 * Recompute and persist intent_score + intent_level for a student.
 * Called after any significant action (scan, swipe, appointment).
 */
export async function refreshIntentScore(userId: string): Promise<void> {
  const { computeIntentScore, computeIntentLevel } = await import('@/lib/scoring/intentScore')
  const supabase = getSupabase()

  const [userRes, scansRes, matchesRes, appointmentsRes] = await Promise.all([
    supabase.from('users').select('email, education_level').eq('id', userId).single(),
    supabase.from('scans').select('channel').eq('user_id', userId),
    supabase.from('matches').select('student_swipe').eq('student_id', userId),
    supabase.from('appointments').select('id').eq('student_id', userId).neq('status', 'cancelled').limit(1),
  ])

  const user        = userRes.data
  const scans       = scansRes.data ?? []
  const matches     = matchesRes.data ?? []
  const hasAppt     = (appointmentsRes.data?.length ?? 0) > 0

  const score = computeIntentScore({
    hasEducationLevel: !!user?.education_level,
    hasRealEmail:      !!user?.email && !user.email.includes('@group.letudiant-salons.fr'),
    standScanCount:    scans.filter(s => s.channel === 'stand').length,
    swipeRightCount:   matches.filter(m => m.student_swipe === 'right').length,
    appointmentBooked: hasAppt,
    conferenceCount:   scans.filter(s => s.channel === 'conference').length,
  })

  const level = computeIntentLevel(score)

  await supabase
    .from('users')
    .update({ intent_score: score, intent_level: level })
    .eq('id', userId)
}

// ─── Pre-Registrations ────────────────────────────────────────────────────────

export async function getPreRegistrations(eventId: string) {
  const { data } = await getSupabase()
    .from('pre_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })
  return data ?? []
}

export async function resolvePreRegistration(email: string, userId: string): Promise<void> {
  await getSupabase()
    .from('pre_registrations')
    .update({ resolved_user_id: userId, resolved_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())
    .is('resolved_user_id', null)
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getAdminStats(eventId: string) {
  const supabase = getSupabase()
  const [usersRes, scansRes, leadsRes, groupsRes] = await Promise.all([
    supabase.from('users').select('id, role, orientation_stage, education_branches', { count: 'exact' }),
    supabase.from('scans').select('id, channel', { count: 'exact' }).eq('event_id', eventId),
    supabase.from('leads').select('score_tier', { count: 'exact' }).eq('event_id', eventId),
    supabase.from('groups').select('id, member_uids', { count: 'exact' }),
  ])
  return {
    totalUsers: usersRes.count ?? 0,
    totalScans: scansRes.count ?? 0,
    totalLeads: leadsRes.count ?? 0,
    totalGroups: groupsRes.count ?? 0,
    entryScans: scansRes.data?.filter(s => s.channel === 'entry').length ?? 0,
    exitScans: scansRes.data?.filter(s => s.channel === 'exit').length ?? 0,
    decidingLeads: leadsRes.data?.filter(l => l.score_tier === 'deciding').length ?? 0,
  }
}
