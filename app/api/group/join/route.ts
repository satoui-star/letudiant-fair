import { NextResponse } from 'next/server'
import { createServiceClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/group/join
 *
 * Called by the group-invite page when a student submits the quick-registration form.
 * Uses the service-role client (admin) to:
 *  1. Validate the invite token
 *  2. Create a pre-confirmed Supabase auth user (no email verification required)
 *  3. Create the user profile in public.users
 *  4. Add the user to the teacher's group (member_uids[])
 *  5. Resolve against pre_registrations if email matches (Eventmaker link)
 *
 * Returns: { userId, name, email, isGuestEmail, groupName, eventName }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, firstName, lastName, email, gdprAccepted, educationLevel } = body

    if (!token || !firstName?.trim() || !lastName?.trim() || !gdprAccepted) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const admin    = createAdminClient()

    // ── 1. Look up group by invite token ──────────────────────────────────────
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, school_name, fair_id, invite_link_expiry, member_uids')
      .eq('invite_link', token)
      .maybeSingle()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Lien d\'invitation invalide ou introuvable' },
        { status: 404 }
      )
    }

    if (new Date(group.invite_link_expiry) < new Date()) {
      return NextResponse.json(
        { error: 'Ce lien d\'invitation a expiré. Demandez un nouveau lien à votre enseignant(e).' },
        { status: 410 }
      )
    }

    // ── 2. Resolve email ──────────────────────────────────────────────────────
    const providedEmail = email?.trim()?.toLowerCase()
    const isGuestEmail  = !providedEmail
    const resolvedEmail = providedEmail || `guest-${crypto.randomUUID()}@group.letudiant-salons.fr`

    // ── 3. Create pre-confirmed auth user ─────────────────────────────────────
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: resolvedEmail,
      password: crypto.randomUUID(),   // random — student never needs this password
      email_confirm: true,             // skip email verification for day-of registration
      user_metadata: {
        name:  `${firstName.trim()} ${lastName.trim()}`,
        role:  'student',
      },
    })

    if (authError) {
      const alreadyExists =
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('already been registered') ||
        authError.message?.toLowerCase().includes('user already exists')

      if (alreadyExists) {
        return NextResponse.json(
          { error: 'Un compte avec cet email existe déjà. Connectez-vous directement.' },
          { status: 409 }
        )
      }
      console.error('[group/join] auth.admin.createUser error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user!.id

    // ── 4. Create user profile ────────────────────────────────────────────────
    const { error: profileError } = await supabase.from('users').insert({
      id:              userId,
      email:           resolvedEmail,
      name:            `${firstName.trim()} ${lastName.trim()}`,
      role:            'student',
      education_level: educationLevel?.trim() || null,
      group_id:        group.id,
      optin_letudiant: gdprAccepted,
      consent_date:    new Date().toISOString(),
      intent_score:    10,   // baseline: completed registration
      intent_level:    'low',
    })

    if (profileError) {
      // Roll back auth user to avoid orphaned accounts
      await admin.auth.admin.deleteUser(userId)
      console.error('[group/join] users.insert error:', profileError)
      return NextResponse.json({ error: 'Erreur lors de la création du profil' }, { status: 500 })
    }

    // ── 5. Add to group member_uids ───────────────────────────────────────────
    const existing = (group.member_uids as string[]) ?? []
    if (!existing.includes(userId)) {
      await supabase
        .from('groups')
        .update({ member_uids: [...existing, userId] })
        .eq('id', group.id)
    }

    // ── 6. Resolve pre_registration if email matches ──────────────────────────
    if (!isGuestEmail) {
      await supabase
        .from('pre_registrations')
        .update({ resolved_user_id: userId, resolved_at: new Date().toISOString() })
        .eq('email', resolvedEmail)
        .is('resolved_user_id', null)
    }

    // ── 7. Fetch event info for the response ──────────────────────────────────
    const { data: eventRow } = await supabase
      .from('events')
      .select('name, event_date, city')
      .eq('id', group.fair_id)
      .maybeSingle()

    return NextResponse.json({
      userId,
      name:        `${firstName.trim()} ${lastName.trim()}`,
      email:       resolvedEmail,
      isGuestEmail,
      groupName:   group.school_name,
      eventName:   eventRow?.name ?? '',
      eventDate:   eventRow?.event_date ?? '',
      eventCity:   eventRow?.city ?? '',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[group/join] unexpected error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
