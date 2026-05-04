import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import crypto from 'crypto'

/**
 * Exhibitor QR endpoints — one unique QR per (school × salon).
 *
 * GET  /api/exhibitor/qr?eventId=<id>   → fetch existing QR (or null if not generated yet)
 * POST /api/exhibitor/qr                → generate QR (idempotent — returns existing if already created)
 *
 * Uniqueness: enforced at the DB level by event_exhibitors UNIQUE(event_id, school_id).
 * The QR payload includes a random 16-byte token so two QRs for the same school
 * but different salons are cryptographically distinct.
 */

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function resolveSchoolForUser(userId: string) {
  const db = svc()
  const { data: school } = await db
    .from('schools')
    .select('id, name')
    .eq('user_id', userId)
    .maybeSingle()
  return school
}

async function resolveActiveEvent(eventId: string | null) {
  const db = svc()
  if (eventId) {
    const { data } = await db.from('events').select('id, name, event_date').eq('id', eventId).maybeSingle()
    return data
  }
  // Auto-pick: closest upcoming event (or most recent past)
  const today = new Date().toISOString().slice(0, 10)
  const { data: upcoming } = await db
    .from('events')
    .select('id, name, event_date')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (upcoming) return upcoming
  const { data: past } = await db
    .from('events')
    .select('id, name, event_date')
    .order('event_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return past
}

export async function GET(request: Request) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const eventIdParam = searchParams.get('eventId')

    const school = await resolveSchoolForUser(user.id)
    if (!school) {
      return NextResponse.json({ error: 'No school linked to this exhibitor account' }, { status: 404 })
    }

    const event = await resolveActiveEvent(eventIdParam)
    if (!event) {
      return NextResponse.json({ error: 'No event found' }, { status: 404 })
    }

    const db = svc()
    const { data: row } = await db
      .from('event_exhibitors')
      .select('id, qr_code, qr_payload, qr_generated_at')
      .eq('school_id', school.id)
      .eq('event_id', event.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      school,
      event,
      qr: row?.qr_code ?? null,
      payload: row?.qr_payload ?? null,
      generatedAt: row?.qr_generated_at ?? null,
      registered: !!row,
    })
  } catch (err: unknown) {
    console.error('[GET /api/exhibitor/qr]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const eventIdParam: string | null = body?.eventId ?? null

    const school = await resolveSchoolForUser(user.id)
    if (!school) {
      return NextResponse.json({ error: 'No school linked to this exhibitor account' }, { status: 404 })
    }

    const event = await resolveActiveEvent(eventIdParam)
    if (!event) {
      return NextResponse.json({ error: 'No event found' }, { status: 404 })
    }

    const db = svc()

    // Check if QR already exists for this (school, event) — return existing
    const { data: existing } = await db
      .from('event_exhibitors')
      .select('id, qr_code, qr_payload, qr_generated_at')
      .eq('school_id', school.id)
      .eq('event_id', event.id)
      .maybeSingle()

    if (existing?.qr_code) {
      return NextResponse.json({
        success: true,
        already_generated: true,
        school,
        event,
        qr: existing.qr_code,
        payload: existing.qr_payload,
        generatedAt: existing.qr_generated_at,
      })
    }

    // Build a unique payload (school + event + random token)
    const token = crypto.randomBytes(8).toString('hex')
    const payloadObj = {
      schoolId: school.id,
      eventId: event.id,
      type: 'school_stand',
      token,
      app: 'letudiant-salons',
    }
    const payloadStr = JSON.stringify(payloadObj)
    const qrDataUrl = await QRCode.toDataURL(payloadStr, {
      width: 360,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    })
    const generatedAt = new Date().toISOString()

    if (existing) {
      // Row exists but no QR yet — update
      const { error } = await db
        .from('event_exhibitors')
        .update({
          qr_code: qrDataUrl,
          qr_payload: payloadStr,
          qr_token: token,
          qr_generated_at: generatedAt,
        })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      // Need to register exhibitor + persist QR atomically
      const { error } = await db.from('event_exhibitors').insert({
        school_id: school.id,
        event_id: event.id,
        qr_code: qrDataUrl,
        qr_payload: payloadStr,
        qr_token: token,
        qr_generated_at: generatedAt,
      })
      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      already_generated: false,
      school,
      event,
      qr: qrDataUrl,
      payload: payloadStr,
      generatedAt,
    })
  } catch (err: unknown) {
    console.error('[POST /api/exhibitor/qr]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
