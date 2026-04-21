/**
 * POST /api/auth/register
 *
 * Server-side account creation. Uses the admin client so:
 *   - email_confirm: true → user is immediately active (no confirmation email needed)
 *   - Works for demo without configuring Supabase email settings
 *
 * Body:
 *   { email, password, firstName, lastName, dob, role,
 *     level?, domains?, parentEmail?, btocId? }
 *
 * Returns:
 *   200 { success: true }
 *   400 { error: string }   — validation or duplicate
 *   500 { error: string }   — unexpected
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    email, password, firstName, lastName, dob,
    role = 'student', level, domains, parentEmail, btocId,
  } = body as {
    email: string; password: string; firstName: string; lastName: string
    dob?: string; role?: string; level?: string; domains?: string[]
    parentEmail?: string; btocId?: string
  }

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
  }

  // Admin accounts are never self-registered. They are seeded via
  // /api/admin/setup (itself admin-gated once the first admin exists).
  const ALLOWED_ROLES = ['student', 'teacher', 'exhibitor', 'parent'] as const
  if (!ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: 'Rôle non autorisé' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── 1. Create auth user (admin API — confirms immediately, no email needed) ──
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         email.toLowerCase().trim(),
    password,
    email_confirm: true,   // skip email confirmation — essential for demo
    user_metadata: {
      name: `${firstName} ${lastName}`.trim(),
      role,
    },
  })

  if (authError) {
    // Surface duplicate-email error clearly
    const msg = authError.message.toLowerCase().includes('already')
      ? 'Un compte existe déjà avec cet email'
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = authData.user.id

  // ── 2. Upsert public profile ──────────────────────────────────────────────
  const dobValue  = dob && dob.trim() ? dob.trim() : null
  const birthYear = dobValue ? new Date(dobValue).getFullYear() : null
  const age       = birthYear ? new Date().getFullYear() - birthYear : 99
  const isMinor   = age < 16

  const { error: profileError } = await supabase.from('users').upsert({
    id:               userId,
    email:            email.toLowerCase().trim(),
    name:             `${firstName} ${lastName}`.trim() || email,
    role:             role as 'student' | 'teacher' | 'exhibitor' | 'admin' | 'parent',
    dob:              dobValue,
    education_level:  level ?? null,
    education_branches: Array.isArray(domains) ? domains : [],
    parent_approved:  !isMinor,
    is_minor:         isMinor,
    parent_email:     isMinor && parentEmail ? parentEmail : null,
    optin_letudiant:  true,
    consent_date:     new Date().toISOString(),
    orientation_stage: 'exploring',
    orientation_score: 0,
    intent_score:     0,
    intent_level:     'low',
    ...(btocId ? { client_id_btoc: btocId } : {}),
  })

  if (profileError) {
    console.error('[register] profile upsert failed:', profileError)
    // Don't fail the whole request — auth user was created, profile can be retried
  }

  // ── 3. Resolve pending Eventmaker pre_registration (students only) ────────
  if (role === 'student') {
    const { data: preReg } = await supabase
      .from('pre_registrations')
      .select('id, eventmaker_registration_id')
      .eq('email', email.toLowerCase().trim())
      .is('resolved_user_id', null)
      .maybeSingle()

    if (preReg) {
      await supabase
        .from('pre_registrations')
        .update({ resolved_user_id: userId, resolved_at: new Date().toISOString() })
        .eq('id', preReg.id)

      if (preReg.eventmaker_registration_id) {
        await supabase
          .from('users')
          .update({ eventmaker_ids: [preReg.eventmaker_registration_id] })
          .eq('id', userId)
      }
    }
  }

  return NextResponse.json({ success: true })
}
