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

// ─── Reels (MOCK DATA FOR NOW) ────────────────────────────────────────────────
// TODO: Replace with real data from school_reels table once approved
// Table migration 012_school_reels.sql is ready to use when needed

import type { SchoolReelRow } from './types'

export async function getAllReels(): Promise<SchoolReelRow[]> {
  // MOCK DATA - Will be replaced with real database query once approved
  // Format: Matches SchoolReelRow structure for easy swap later

  const mockReels: SchoolReelRow[] = [
    {
      id: 'reel-001',
      school_id: 'school-hec',
      title: 'Campus Tour - HEC Paris',
      description: 'Discover the beautiful HEC Paris campus in Jouy-en-Josas. Walk through our classrooms, library, and student spaces.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration_seconds: 120,
      thumbnail_color: '#EC1F27',
      tags: ['Campus', 'Tour', 'HEC'],
      view_count: 2400,
      published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reel-002',
      school_id: 'school-polytechnique',
      title: 'Engineering Life at Polytechnique',
      description: 'What is it really like to study engineering at Polytechnique? Hear from current students about their experience.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration_seconds: 180,
      thumbnail_color: '#0066CC',
      tags: ['Engineering', 'Student Life', 'Polytechnique'],
      view_count: 3150,
      published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reel-003',
      school_id: 'school-sorbonne',
      title: 'Sorbonne Université - Research Excellence',
      description: 'Join us as we explore groundbreaking research happening at Sorbonne. From physics to literature, discover innovation.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration_seconds: 150,
      thumbnail_color: '#FFC0D9',
      tags: ['Research', 'University', 'Innovation'],
      view_count: 1820,
      published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reel-004',
      school_id: 'school-essec',
      title: 'ESSEC Business School - MBA Experience',
      description: 'Our MBA students share their journey and what makes ESSEC unique in the business education landscape.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration_seconds: 200,
      thumbnail_color: '#00BFB3',
      tags: ['MBA', 'Business', 'Experience'],
      view_count: 2890,
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reel-005',
      school_id: 'school-isen',
      title: 'ISEN Yncréa - Tech Innovation Lab',
      description: 'Step inside our innovation lab where students build cutting-edge projects in AI, robotics, and IoT.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration_seconds: 160,
      thumbnail_color: '#E6A800',
      tags: ['Tech', 'Innovation', 'Lab'],
      view_count: 1950,
      published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return mockReels;
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

export async function saveSchoolToWishlist(userId: string, schoolId: string): Promise<void> {
  const { data: user } = await getSupabase()
    .from('users')
    .select('wishlist')
    .eq('id', userId)
    .single()

  const wishlist = user?.wishlist ?? []

  if (!wishlist.includes(schoolId)) {
    await getSupabase()
      .from('users')
      .update({ wishlist: [...wishlist, schoolId] })
      .eq('id', userId)
  }
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

// ─── Booth Captures (Phygital) ────────────────────────────────────────────────

/**
 * Get booth captures for a user by email (for phygital data merging).
 * Used to access non-app-user booth signals.
 */
export async function getBoothCapturesByEmail(email: string) {
  const { data } = await getSupabase()
    .from('booth_captures')
    .select('*, stands(*, schools(name))')
    .eq('email', email)
    .is('synced_to_user_id', null)
    .order('captured_at', { ascending: false })
  return data ?? []
}

/**
 * Get all booth captures for a student (after sync).
 * Used to view historical booth interactions.
 */
export async function getBoothCapturesForStudent(userId: string) {
  const { data } = await getSupabase()
    .from('booth_captures')
    .select('*, stands(*, schools(name))')
    .eq('synced_to_user_id', userId)
    .order('captured_at', { ascending: false })
  return data ?? []
}

/**
 * Enhanced refreshIntentScore that includes booth capture signals.
 * Incorporates non-app-user orientation data into intent scoring.
 *
 * Weighting:
 *   - If student has app activity: use app signals (70%) + booth signals (30%)
 *   - If student has ONLY booth data: use booth orientation_stage directly
 *   - Booth signal recency matters: fresh captures (< 7 days) get higher weight
 */
export async function refreshIntentScoreWithBoothData(userId: string): Promise<void> {
  const { computeIntentScore, computeIntentLevel } = await import('@/lib/scoring/intentScore')
  const supabase = getSupabase()

  // Get user + all signals (app + booth)
  const [userRes, scansRes, matchesRes, appointmentsRes, boothRes] = await Promise.all([
    supabase.from('users').select('email, education_level').eq('id', userId).single(),
    supabase.from('scans').select('channel').eq('user_id', userId),
    supabase.from('matches').select('student_swipe').eq('student_id', userId),
    supabase.from('appointments').select('id').eq('student_id', userId).neq('status', 'cancelled').limit(1),
    supabase
      .from('booth_captures')
      .select('orientation_stage, captured_at')
      .eq('synced_to_user_id', userId)
      .order('captured_at', { ascending: false }),
  ])

  const user = userRes.data
  const scans = scansRes.data ?? []
  const matches = matchesRes.data ?? []
  const hasAppt = (appointmentsRes.data?.length ?? 0) > 0
  const boothCaptures = boothRes.data ?? []

  // ─── Compute app-only intent score ────────────────────────────────────────

  const appScore = computeIntentScore({
    hasEducationLevel: !!user?.education_level,
    hasRealEmail: !!user?.email && !user.email.includes('@group.letudiant-salons.fr'),
    standScanCount: scans.filter(s => s.channel === 'stand').length,
    swipeRightCount: matches.filter(m => m.student_swipe === 'right').length,
    appointmentBooked: hasAppt,
    conferenceCount: scans.filter(s => s.channel === 'conference').length,
  })

  // ─── Incorporate booth signals ────────────────────────────────────────────

  let finalScore = appScore
  let boothContribution = 0

  if (boothCaptures.length > 0) {
    const mostRecentCapture = boothCaptures[0]
    const capturedDaysAgo = Math.floor(
      (Date.now() - new Date(mostRecentCapture.captured_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Booth stage → numeric value (for blending)
    const boothStageToValue = { exploring: 30, comparing: 65, deciding: 90 }
    const boothValue = boothStageToValue[mostRecentCapture.orientation_stage as keyof typeof boothStageToValue] || 30

    // Recency weight: full (1.0) if <7 days, decays after
    const recencyWeight = capturedDaysAgo < 7 ? 1.0 : Math.max(0.5, 1.0 - (capturedDaysAgo - 7) / 30)

    // If student has app activity: blend (70% app + 30% booth)
    // If student has NO app activity: use booth signal directly
    if (scans.length > 0 || matches.length > 0 || hasAppt) {
      boothContribution = boothValue * 0.3 * recencyWeight
      finalScore = Math.round(appScore * 0.7 + boothContribution)
    } else {
      // No app activity: booth data is authoritative
      finalScore = Math.round(boothValue * recencyWeight)
    }
  }

  const level = computeIntentLevel(finalScore)

  // ─── Persist updated score ────────────────────────────────────────────────

  await supabase
    .from('users')
    .update({
      intent_score: finalScore,
      intent_level: level,
      orientation_stage: level, // Map intent_level back to orientation_stage
    })
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

// ─── Formations (Programs) ────────────────────────────────────────────────────

export async function saveFormationToWishlist(userId: string, formationId: string): Promise<void> {
  console.log('🟢 saveFormationToWishlist() START - userId:', userId, 'formationId:', formationId);

  const supabase = getSupabase()

  // Step 1: Update users.wishlist array (keep for backward compatibility)
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('wishlist')
    .eq('id', userId)
    .single()

  console.log('📖 Wishlist fetched - error:', fetchError, 'data:', user?.wishlist);

  if (fetchError) {
    console.error('❌ Error fetching user wishlist:', fetchError);
    return;
  }

  const wishlist = user?.wishlist ?? []
  console.log('📋 Current wishlist:', wishlist, 'Length:', wishlist.length);
  console.log('🔍 Checking if', formationId, 'is in wishlist:', wishlist.includes(formationId));

  if (!wishlist.includes(formationId)) {
    console.log('✨ Formation NOT in wishlist, attempting to ADD');
    const newWishlist = [...wishlist, formationId];
    console.log('📝 New wishlist array:', newWishlist);

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ wishlist: newWishlist })
      .eq('id', userId)
      .select();

    console.log('🔄 Update response - data:', updateData, 'error:', updateError);

    if (updateError) {
      console.error('❌ Error updating wishlist:', updateError);
      return;
    }

    // Step 2: Also insert into user_saved_formations table with timestamp
    console.log('⏰ Registering save timestamp in user_saved_formations...');
    const { error: insertError } = await supabase
      .from('user_saved_formations')
      .insert({
        user_id: userId,
        formation_id: formationId,
        saved_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('⚠️ Error registering save timestamp:', insertError);
      // Don't return - wishlist was already updated, this is just tracking
    } else {
      console.log('✅ Successfully saved formation to wishlist with timestamp:', formationId);
    }
  } else {
    console.log('⚠️ Formation already in wishlist, skipping');
  }
}

// ─── Get saved formations from wishlist ────────────────────────────────────

export async function getSavedFormations(formationIds: string[]) {
  if (formationIds.length === 0) {
    return []
  }

  // Get formations directly by ID
  const { data: formations } = await getSupabase()
    .from('formations')
    .select('*, schools(name, city, type)')
    .in('id', formationIds)

  return formations?.map((f: any) => ({
    ...f,
    schoolId: f.school_id,
    schoolName: f.schools?.name ?? 'École',
    schoolCity: f.schools?.city ?? '',
    schoolType: f.schools?.type ?? '',
  })) ?? []
}

// ─── Get saved formations with save date (from wishlist + user_saved_formations table) ───

export async function getSavedFormationsWithDates(userId: string) {
  console.log('📅 getSavedFormationsWithDates() - userId:', userId);

  const supabase = getSupabase()

  // Step 1: Get user's wishlist (all saved formations)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('wishlist')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('❌ Error fetching user wishlist:', userError);
    return []
  }

  const wishlist = (userData?.wishlist as string[]) ?? [];
  console.log('💾 Wishlist has', wishlist.length, 'formations');

  if (wishlist.length === 0) {
    console.log('⚠️ No saved formations found');
    return []
  }

  // Step 2: Get save dates from user_saved_formations table
  const { data: savedRecords } = await supabase
    .from('user_saved_formations')
    .select('formation_id, saved_at')
    .eq('user_id', userId);

  // Create map of formation_id → saved_at
  const saveDatesMap = new Map(
    savedRecords?.map((r: any) => [r.formation_id, r.saved_at]) ?? []
  );
  console.log('📅 Found save dates for', saveDatesMap.size, 'formations');

  // Step 3: Get formation details for all wishlist items
  const { data: formations, error: formError } = await supabase
    .from('formations')
    .select('*, schools(name, city, type)')
    .in('id', wishlist);

  if (formError) {
    console.error('❌ Error fetching formation details:', formError);
    return []
  }

  // Step 4: Map formations with their save dates (if available)
  const result = formations
    ?.map((f: any) => ({
      ...f,
      schoolId: f.school_id,
      schoolName: f.schools?.name ?? 'École',
      schoolCity: f.schools?.city ?? '',
      schoolType: f.schools?.type ?? '',
      saved_at: saveDatesMap.get(f.id) ?? f.created_at, // ← Use saved_at if available, else fall back to formation created_at
    }))
    .sort((a: any, b: any) => {
      // Sort by saved_at descending (newest first)
      const dateA = new Date(a.saved_at).getTime();
      const dateB = new Date(b.saved_at).getTime();
      return dateB - dateA;
    }) ?? [];

  console.log('✅ Loaded', result.length, 'formations with save dates');
  return result;
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
