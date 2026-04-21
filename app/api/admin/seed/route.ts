import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

/**
 * Seed endpoint: generates test data for the dashboard.
 * Admin-only + dev-only by default. Set ALLOW_SEED=true in production if you
 * really need to run it there.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    return NextResponse.json(
      { error: 'Seed endpoint disabled in production' },
      { status: 403 },
    )
  }
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const { searchParams } = new URL(request.url)
    const eventCount = parseInt(searchParams.get('events') ?? '3', 10)
    const scanCount = parseInt(searchParams.get('scans') ?? '500', 10)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 1. Create test events
    const events = []
    const now = new Date()
    for (let i = 0; i < eventCount; i++) {
      const eventDate = new Date(now.getTime() + (i - 1) * 30 * 24 * 60 * 60 * 1000) // 30 days apart
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          name: `Salon L'Étudiant ${['Paris', 'Lyon', 'Marseille', 'Toulouse'][i % 4]}`,
          event_date: eventDate.toISOString(),
          city: ['Paris', 'Lyon', 'Marseille', 'Toulouse'][i % 4],
          is_active: i === 0, // First event is live
        })
        .select()
        .single()
      if (error) throw error
      events.push(event)
    }

    // 2. Create test schools (booths)
    const schoolNames = [
      'Université Paris-Sorbonne',
      'École Polytechnique',
      'HEC Paris',
      'Sciences Po',
      'ESSEC',
      'ESCP',
      'Université Lyon 1',
      'Université Marseille',
    ]
    const schools = []
    for (const name of schoolNames.slice(0, 6)) {
      const { data: school } = await supabase
        .from('schools')
        .insert({
          name,
          city: events[0].city,
          school_type: ['Université', 'Grande École', 'Lycée'][Math.floor(Math.random() * 3)],
          category: ['Sciences', 'Lettres', 'Commerce'][Math.floor(Math.random() * 3)],
        })
        .select()
        .single()
      schools.push(school)
    }

    // 3. Create test students
    const studentData = []
    for (let i = 0; i < 100; i++) {
      studentData.push({
        email: `student${i}@test.fr`,
        name: `Étudiant ${i}`,
        role: 'student',
      })
    }
    const { data: students } = await supabase.from('users').insert(studentData).select()

    // 4. Create test scans
    const scanData = []
    const channels = ['entry', 'booth', 'conference', 'exit']
    if (students && students.length > 0 && schools.length > 0) {
      for (let i = 0; i < scanCount; i++) {
        const student = students[Math.floor(Math.random() * students.length)]
        const school = schools[Math.floor(Math.random() * schools.length)]
        scanData.push({
          user_id: student.id,
          event_id: events[0].id,
          stand_id: school.id,
          channel: channels[Math.floor(Math.random() * channels.length)],
          dwell_estimate: Math.floor(Math.random() * 120),
          created_at: new Date(
            now.getTime() - Math.random() * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      }
      // Insert in batches of 100
      for (let i = 0; i < scanData.length; i += 100) {
        await supabase.from('scans').insert(scanData.slice(i, i + 100)).select()
      }
    }

    // 5. Create test matches (optional - may not have this table)
    try {
      const matchData = []
      if (students && students.length > 0 && schools.length > 0) {
        for (let i = 0; i < 50; i++) {
          matchData.push({
            student_id: students[Math.floor(Math.random() * students.length)].id,
            school_id: schools[Math.floor(Math.random() * schools.length)].id,
            student_swipe: Math.random() > 0.3 ? 'right' : 'left',
            school_interest: Math.random() > 0.5,
          })
        }
        await supabase.from('matches').insert(matchData).select()
      }
    } catch (matchErr) {
      console.log('Matches table not available, skipping')
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${eventCount} events, ${schools.length} schools, 100 students, ${scanCount} scans`,
      stats: {
        events: eventCount,
        schools: schools.length,
        students: 100,
        scans: scanCount,
        matches: matchData.length,
      },
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/seed]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
