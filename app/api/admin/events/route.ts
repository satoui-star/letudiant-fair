import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const city = searchParams.get('city')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    let query = supabase.from('events').select('*')

    if (status === 'upcoming') {
      query = query.gt('event_date', new Date().toISOString()).order('event_date', { ascending: true })
    } else if (status === 'live') {
      query = query.eq('is_active', true)
    } else if (status === 'archived') {
      query = query.lt('event_date', new Date().toISOString())
    }

    if (city) {
      query = query.eq('city', city)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: (data || []).length,
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/events]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabase
      .from('events')
      .insert({ ...body, created_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/admin/events]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
