import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET /api/events/[id]/stands — returns positioned stands with school info for the SVG map */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('stands')
      .select(`
        id,
        school_id,
        stand_label,
        category,
        map_position,
        schools (
          name,
          type,
          city,
          website
        )
      `)
      .eq('event_id', eventId)
      .not('map_position', 'is', null)
      .order('stand_label', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/stands]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
