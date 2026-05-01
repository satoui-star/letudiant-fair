import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const { schoolId } = await request.json()
    if (!schoolId) return NextResponse.json({ error: 'School ID required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify user owns this school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .eq('user_id', user.id)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found or unauthorized' }, { status: 403 })
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_exhibitors')
      .select('id')
      .eq('event_id', eventId)
      .eq('school_id', schoolId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 409 })
    }

    // Register exhibitor
    const { data, error } = await supabase
      .from('event_exhibitors')
      .insert({
        event_id: eventId,
        school_id: schoolId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/events/[id]/register-exhibitor]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
