import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { qrData } = await request.json()
    if (!qrData) return NextResponse.json({ error: 'QR data required' }, { status: 400 })

    // Parse QR data: event:eventId|student:userId|type:entry|exit
    const match = qrData.match(/event:([^|]+)\|student:([^|]+)\|type:([^|]+)/)
    if (!match) return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })

    const [, eventId, userId, scanType] = match
    if (scanType !== 'entry' && scanType !== 'exit') {
      return NextResponse.json({ error: 'Invalid scan type' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find the event_student record
    const { data: eventStudent, error: findError } = await supabase
      .from('event_students')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (findError || !eventStudent) {
      return NextResponse.json({ error: 'Student not registered for this event' }, { status: 404 })
    }

    // Record the scan
    const scanColumn = scanType === 'entry' ? 'scanned_entry' : 'scanned_exit'
    const { error: updateError } = await supabase
      .from('event_students')
      .update({
        [scanColumn]: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventStudent.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: scanType === 'entry' ? 'Entrée enregistrée' : 'Sortie enregistrée',
      type: scanType,
      eventId,
      userId,
    })
  } catch (err: unknown) {
    console.error('[POST /api/events/[id]/scan-qr]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
