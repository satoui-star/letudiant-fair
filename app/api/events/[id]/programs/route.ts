import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET /api/events/[id]/programs — public endpoint to fetch event programs for students */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('event_programs')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/programs]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
