import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET /api/events/[id]/stands — positioned stands with school info for the SVG map */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Step 1 — fetch stands that have a map position
    const { data: stands, error: standsErr } = await supabase
      .from('stands')
      .select('id, school_id, stand_label, category, map_position')
      .eq('event_id', eventId)
      .not('map_position', 'is', null)
      .order('stand_label', { ascending: true })

    if (standsErr) throw standsErr
    if (!stands || stands.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Step 2 — fetch school names for those stands (separate query, no join ambiguity)
    const schoolIds = [...new Set(stands.map(s => s.school_id))]
    const { data: schools, error: schoolsErr } = await supabase
      .from('schools')
      .select('id, name, type, city, website')
      .in('id', schoolIds)

    if (schoolsErr) throw schoolsErr

    const schoolMap = Object.fromEntries((schools ?? []).map(s => [s.id, s]))

    // Step 3 — merge
    const data = stands.map(stand => ({
      ...stand,
      schools: schoolMap[stand.school_id] ?? null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/stands]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
