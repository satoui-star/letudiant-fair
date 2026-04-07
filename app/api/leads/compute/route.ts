import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/leads/compute
// Body: { studentId, schoolId, eventId }
// Computes lead score and upserts to leads table
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { studentId, schoolId, eventId } = body

  if (!studentId || !schoolId || !eventId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch student profile
  const { data: student } = await supabase
    .from('users').select('education_level, education_branches, study_wishes').eq('id', studentId).single()

  // Fetch school targeting criteria
  const { data: school } = await supabase
    .from('schools').select('target_levels, target_fields').eq('id', schoolId).single()

  // Fetch behavioural signals
  const { data: scans } = await supabase
    .from('scans').select('channel, stand_id, session_id, dwell_estimate')
    .eq('user_id', studentId).eq('event_id', eventId)

  const { data: match } = await supabase
    .from('matches').select('student_swipe')
    .eq('student_id', studentId).eq('school_id', schoolId).maybeSingle()

  if (!student || !school) {
    return NextResponse.json({ error: 'Student or school not found' }, { status: 404 })
  }

  const standsVisited = scans?.filter(s => s.channel === 'stand').map(s => s.stand_id ?? '') ?? []
  const confsAttended = scans?.filter(s => s.channel === 'conference').map(s => s.session_id ?? '') ?? []
  const totalDwell = scans?.reduce((sum, s) => sum + (s.dwell_estimate ?? 0), 0) ?? 0

  // Declarative score (0–1)
  const levelMatch = school.target_levels?.includes(student.education_level ?? '') ? 1 : 0
  const fieldOverlap = (() => {
    const sf = student.education_branches ?? []
    const tf = school.target_fields ?? []
    if (!sf.length || !tf.length) return 0
    return sf.filter((f: string) => tf.includes(f)).length / Math.max(sf.length, tf.length)
  })()
  const declarativeScore = 0.4 * fieldOverlap + 0.3 * levelMatch + 0.3 * (sf => sf.length > 0 ? 0.7 : 0.3)(student.study_wishes ?? [])

  // Behavioural score (0–1)
  const visitedStand = standsVisited.length > 0 ? 1 : 0
  const attendedConf = confsAttended.length > 0 ? 1 : 0
  const swipedRight = match?.student_swipe === 'right' ? 1 : 0
  const dwellScore = Math.min(totalDwell / 1800, 1) // 30min cap
  const behaviouralScore = 0.25 * visitedStand + 0.25 * attendedConf + 0.30 * swipedRight + 0.20 * dwellScore

  const rawScore = 0.5 * declarativeScore + 0.5 * behaviouralScore
  const scoreValue = Math.round(rawScore * 100)
  const scoreTier = scoreValue <= 40 ? 'exploring' : scoreValue <= 65 ? 'comparing' : 'deciding'

  // Upsert lead
  await supabase.from('leads').upsert({
    student_id: studentId,
    school_id: schoolId,
    event_id: eventId,
    education_level: student.education_level ?? '',
    education_branches: student.education_branches ?? [],
    study_wishes: student.study_wishes ?? [],
    stands_visited: standsVisited,
    confs_attended: confsAttended,
    dwell_minutes: Math.round(totalDwell / 60),
    swipe_result: match?.student_swipe === 'right',
    score_value: scoreValue,
    score_tier: scoreTier as 'exploring' | 'comparing' | 'deciding',
    score_computed_at: new Date().toISOString(),
  } as never, { onConflict: 'student_id,school_id,event_id' })

  return NextResponse.json({ scoreValue, scoreTier })
}
