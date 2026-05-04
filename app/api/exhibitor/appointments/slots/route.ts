import { NextResponse } from 'next/server'

/**
 * This endpoint is no longer used.
 *
 * Student appointment booking writes directly to the `appointments` table
 * using slot_time values from a hardcoded grid on /schools/[schoolId].
 * The exhibitor page groups those rows by slot_time — no separate slots
 * table or API is needed.
 */

export async function GET() {
  return NextResponse.json({ error: 'Not used' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Not used' }, { status: 410 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not used' }, { status: 410 })
}
