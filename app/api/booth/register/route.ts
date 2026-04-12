import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ─── POST /api/booth/register ─────────────────────────────────────────────────
// Creates a minimal guest student profile from the Score Booth kiosk.
// No password required — auth is handled via service-role on kiosk.
// Returns the new user's ID so the client can generate a QR code instantly.

export async function POST(request: Request) {
  const body = await request.json()
  const { firstName, lastName, email, educationLevel } = body as {
    firstName:      string
    lastName:       string
    email?:         string
    educationLevel: string
  }

  if (!firstName?.trim() || !lastName?.trim() || !educationLevel) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── Build a booth-scoped email if none provided ───────────────────────────
  const guestEmail = email?.trim()
    || `booth_${crypto.randomUUID().replace(/-/g,'').slice(0,8)}@booth.letudiant-salons.fr`

  const fullName = `${firstName.trim()} ${lastName.trim()}`

  // ── Create auth user (no password — kiosk only) ───────────────────────────
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email:          guestEmail,
    email_confirm:  true,
    user_metadata:  {
      name:            fullName,
      role:            'student',
      booth_registered: true,
    },
  })

  if (authError || !authUser.user) {
    console.error('[booth] createUser failed:', authError)
    return NextResponse.json({ error: authError?.message ?? 'Erreur serveur' }, { status: 500 })
  }

  const uid = authUser.user.id

  // ── Create users row via service client ───────────────────────────────────
  const { error: profileError } = await admin
    .from('users')
    .upsert({
      id:               uid,
      email:            guestEmail,
      name:             fullName,
      role:             'student',
      education_level:  educationLevel,
      intent_score:     5,
      intent_level:     'low',
    })

  if (profileError) {
    console.error('[booth] profile upsert failed:', profileError)
    // Still return uid — QR can be generated, profile will be created by trigger
  }

  return NextResponse.json({ uid, name: fullName, isGuest: !email?.trim() }, { status: 201 })
}
