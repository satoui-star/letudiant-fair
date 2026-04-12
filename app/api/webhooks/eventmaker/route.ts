import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// EventMaker sends POST with this shape (simplified):
interface EventMakerPayload {
  registration_id: string       // EventMaker's own ID
  email: string
  first_name: string
  last_name: string
  education_level?: string
  bac_series?: string
  postal_code?: string
  declared_domains?: string[]
  event_id: string              // Our internal event UUID (mapped from EventMaker event ID)
}

export async function POST(request: Request) {
  // Verify shared secret
  const authHeader = request.headers.get('x-webhook-secret')
  if (authHeader !== process.env.EVENTMAKER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: EventMakerPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, first_name, last_name, education_level, bac_series,
          postal_code, declared_domains, event_id, registration_id } = payload

  if (!email || !first_name || !last_name || !event_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Check if user already exists in our system
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  // 2. Upsert pre_registration record
  const { error: upsertError } = await supabase
    .from('pre_registrations')
    .upsert({
      email:                      email.toLowerCase().trim(),
      first_name,
      last_name,
      education_level:            education_level ?? null,
      bac_series:                 bac_series      ?? null,
      postal_code:                postal_code     ?? null,
      declared_domains:           declared_domains ?? [],
      event_id,
      eventmaker_registration_id: registration_id,
      resolved_user_id:           existingUser?.id ?? null,
      resolved_at:                existingUser ? new Date().toISOString() : null,
    }, { onConflict: 'email' })

  if (upsertError) {
    console.error('[eventmaker webhook] upsert error:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // 3. If user exists, enrich their profile with EventMaker data
  if (existingUser) {
    const updates: Record<string, unknown> = {}
    if (education_level) updates.education_level = education_level
    if (bac_series)      updates.bac_series      = bac_series
    if (postal_code)     updates.postal_code      = postal_code
    if (declared_domains?.length) {
      // Merge declared_domains with existing education_branches
      const { data: current } = await supabase
        .from('users').select('education_branches').eq('id', existingUser.id).single()
      const merged = Array.from(new Set([...(current?.education_branches ?? []), ...declared_domains]))
      updates.education_branches = merged
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', existingUser.id)
        .catch(err => console.error('[eventmaker] profile enrichment failed:', err))
    }
  }

  return NextResponse.json({
    status: existingUser ? 'resolved' : 'pending',
    user_id: existingUser?.id ?? null,
    message: existingUser
      ? 'Pre-registration linked to existing user'
      : 'Pre-registration stored, will be resolved on app registration',
  })
}
