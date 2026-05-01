import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import QRCode from 'qrcode'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const eventId = params.id
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Get all students for this event
    const { data: students, error: studentsError } = await supabase
      .from('event_students')
      .select('id, user_id')
      .eq('event_id', eventId)

    if (studentsError) throw studentsError
    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, message: 'No students to generate QR codes for' })
    }

    // Generate QR codes for each student
    const updates = await Promise.all(
      students.map(async (student) => {
        const entryQrData = `event:${eventId}|student:${student.user_id}|type:entry`
        const exitQrData = `event:${eventId}|student:${student.user_id}|type:exit`

        const entryQr = await QRCode.toDataURL(entryQrData)
        const exitQr = await QRCode.toDataURL(exitQrData)

        return {
          id: student.id,
          entry_qr: entryQr,
          exit_qr: exitQr,
        }
      })
    )

    // Batch update students with QR codes
    for (const update of updates) {
      const { error } = await supabase
        .from('event_students')
        .update({ entry_qr: update.entry_qr, exit_qr: update.exit_qr })
        .eq('id', update.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true, count: students.length })
  } catch (err: unknown) {
    console.error('[POST /api/admin/events/[id]/generate-qr]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
