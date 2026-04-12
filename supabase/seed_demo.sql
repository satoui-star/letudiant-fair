-- ═══════════════════════════════════════════════════════════════════════════
-- L'ÉTUDIANT SALONS — Demo Seed (run AFTER schema.sql + migrations 001–005)
-- ─────────────────────────────────────────────────────────────────────────
-- HOW TO USE:
--   1. Run schema.sql + all migrations in the Supabase SQL Editor
--   2. Create real test accounts via the app or Supabase Auth dashboard:
--        • student@demo.fr        (role: student)
--        • teacher@demo.fr        (role: teacher)
--        • exhibitor@demo.fr      (role: exhibitor)
--        • parent@demo.fr         (role: parent)
--   3. Replace the 4 UUIDs below with the real auth.users IDs from:
--        Dashboard → Authentication → Users
--   4. Run this file — all scans, matches, appointments wire up correctly
-- ═══════════════════════════════════════════════════════════════════════════

-- ── REPLACE THESE WITH REAL UUIDs FROM auth.users ────────────────────────
-- \set STUDENT_UID   'aaaaaaaa-0000-0000-0000-000000000001'
-- \set TEACHER_UID   'bbbbbbbb-0000-0000-0000-000000000001'
-- \set EXHIBITOR_UID 'cccccccc-0000-0000-0000-000000000001'
-- \set PARENT_UID    'dddddddd-0000-0000-0000-000000000001'
--
-- For quick demo, uncomment and set these directly:
do $$
declare
  STUDENT_UID   uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  TEACHER_UID   uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  EXHIBITOR_UID uuid := 'cccccccc-0000-0000-0000-000000000001';
  PARENT_UID    uuid := 'dddddddd-0000-0000-0000-000000000001';
  PARIS_EVENT   uuid := 'a1b2c3d4-0000-0000-0000-000000000001';
  EPITECH_SCHOOL uuid := 'b1b2c3d4-0000-0000-0000-000000000006';
  ENSAD_SCHOOL  uuid := 'b1b2c3d4-0000-0000-0000-000000000013';
  SCIENCESPO_SCHOOL uuid := 'b1b2c3d4-0000-0000-0000-000000000001';
  entry_scan_id uuid;
  exit_scan_id  uuid;
  stand_id_epitech uuid;
  stand_id_ensad   uuid;
begin

  -- ── USER PROFILES ────────────────────────────────────────────────────────
  -- Note: auth.users rows must already exist (created via Supabase Auth)
  -- These upserts create/update the public.users profile rows.

  insert into public.users (id, email, name, role, education_level, bac_series,
    education_branches, intent_score, intent_level, is_booth_registered,
    optin_letudiant, optin_commercial, consent_date)
  values
    (STUDENT_UID, 'student@demo.fr', 'Léa Moreau', 'student', 'terminale', 'Générale',
     ARRAY['Art et Design','Architecture'], 65, 'medium', false,
     true, true, now()),
    (TEACHER_UID, 'teacher@demo.fr', 'M. Dupont', 'teacher', null, null,
     '{}', 0, 'low', false, false, false, null),
    (EXHIBITOR_UID, 'exhibitor@demo.fr', 'Responsable EPITECH', 'exhibitor', null, null,
     '{}', 0, 'low', false, false, false, null),
    (PARENT_UID, 'parent@demo.fr', 'Marie Moreau', 'parent', null, null,
     '{}', 0, 'low', false, false, false, null)
  on conflict (id) do update set
    name = excluded.name, role = excluded.role,
    education_level = excluded.education_level,
    education_branches = excluded.education_branches,
    intent_score = excluded.intent_score, intent_level = excluded.intent_level;

  -- Link student to parent
  update public.users set parent_email = 'parent@demo.fr' where id = STUDENT_UID;

  -- ── TEACHER GROUP ────────────────────────────────────────────────────────
  insert into public.groups (id, teacher_id, fair_id, group_name, invite_link,
    invite_link_expiry, member_uids)
  values (
    'eeeeeeee-0000-0000-0000-000000000001',
    TEACHER_UID,
    PARIS_EVENT,
    'Terminale 1 — Lycée Victor Hugo',
    'demo-invite-abc123',
    now() + interval '30 days',
    ARRAY[STUDENT_UID]
  )
  on conflict (id) do update set
    member_uids = public.groups.member_uids || ARRAY[STUDENT_UID];

  -- ── SCANS — Full journey: entry → 3 stands → conference → exit ───────────

  -- Entry scan (09:12)
  insert into public.scans (id, user_id, event_id, channel, created_at)
  values ('sc000001-0000-0000-0000-000000000001', STUDENT_UID, PARIS_EVENT, 'entry',
    '2026-04-18 09:12:00+02')
  on conflict (id) do nothing
  returning id into entry_scan_id;

  -- Get stand IDs for EPITECH and ENSAD at Paris event
  select id into stand_id_epitech from public.stands
    where event_id = PARIS_EVENT and school_id = EPITECH_SCHOOL limit 1;
  select id into stand_id_ensad from public.stands
    where event_id = PARIS_EVENT and school_id = ENSAD_SCHOOL limit 1;

  -- Stand scan 1 — EPITECH (09:35)
  insert into public.scans (user_id, event_id, stand_id, channel, created_at)
  values (STUDENT_UID, PARIS_EVENT, stand_id_epitech, 'stand', '2026-04-18 09:35:00+02')
  on conflict do nothing;

  -- Stand scan 2 — ENSAD (10:10)
  insert into public.scans (user_id, event_id, stand_id, channel, created_at)
  values (STUDENT_UID, PARIS_EVENT, stand_id_ensad, 'stand', '2026-04-18 10:10:00+02')
  on conflict do nothing;

  -- Conference scan — "Métiers du design" (10:30)
  insert into public.scans (user_id, event_id, channel, created_at)
  values (STUDENT_UID, PARIS_EVENT, 'conference', '2026-04-18 10:30:00+02')
  on conflict do nothing;

  -- Exit scan (12:18) → dwell = 186 minutes
  insert into public.scans (id, user_id, event_id, channel, created_at)
  values ('sc000001-0000-0000-0000-000000000099', STUDENT_UID, PARIS_EVENT, 'exit',
    '2026-04-18 12:18:00+02')
  on conflict (id) do nothing;

  -- Persist dwell on user profile (mirrors what the API does in real-time)
  update public.users set last_dwell_minutes = 186 where id = STUDENT_UID;

  -- ── MATCHES ──────────────────────────────────────────────────────────────
  -- Swiped right on ENSAD and Sciences Po, left on HEC
  insert into public.matches (student_id, school_id, student_swipe, created_at)
  values
    (STUDENT_UID, ENSAD_SCHOOL,       'right', '2026-04-18 10:15:00+02'),
    (STUDENT_UID, SCIENCESPO_SCHOOL,  'right', '2026-04-18 09:55:00+02'),
    (STUDENT_UID, 'b1b2c3d4-0000-0000-0000-000000000002', 'left', '2026-04-18 09:50:00+02')
  on conflict do nothing;

  -- ── APPOINTMENT ──────────────────────────────────────────────────────────
  insert into public.appointments
    (student_id, school_id, event_id, slot_time, slot_duration, status, student_notes)
  values (
    STUDENT_UID,
    ENSAD_SCHOOL,
    PARIS_EVENT,
    '2026-04-18 11:00:00+02',
    15,
    'confirmed',
    'Je suis intéressée par l''option Architecture Intérieure'
  )
  on conflict do nothing;

  -- ── BOOTH-REGISTERED USERS (3 walk-ins captured at Score Booth) ──────────
  -- These use auto-generated booth emails (no password).
  -- In production, the booth API creates these via createAdminClient().
  -- For the demo, we insert them directly as they would appear post-creation.

  insert into public.users (id, email, name, role, education_level,
    intent_score, intent_level, is_booth_registered, consent_date)
  values
    ('f1000001-0000-0000-0000-000000000001',
     'booth_f1000001@booth.letudiant-salons.fr', 'Thomas B.', 'student',
     'Terminale Générale', 5, 'low', true, '2026-04-18 09:05:00+02'),
    ('f1000002-0000-0000-0000-000000000002',
     'booth_f1000002@booth.letudiant-salons.fr', 'Camille D.', 'student',
     'BTS 1ère année', 5, 'low', true, '2026-04-18 09:22:00+02'),
    ('f1000003-0000-0000-0000-000000000003',
     'booth_f1000003@booth.letudiant-salons.fr', 'Noé M.', 'student',
     'Terminale Technologique', 5, 'low', true, '2026-04-18 10:45:00+02')
  on conflict (id) do nothing;

  -- Booth users also get entry scans (they scan their QR at stands)
  insert into public.scans (user_id, event_id, channel, created_at)
  values
    ('f1000001-0000-0000-0000-000000000001', PARIS_EVENT, 'entry', '2026-04-18 09:06:00+02'),
    ('f1000002-0000-0000-0000-000000000002', PARIS_EVENT, 'entry', '2026-04-18 09:23:00+02'),
    ('f1000003-0000-0000-0000-000000000003', PARIS_EVENT, 'entry', '2026-04-18 10:46:00+02')
  on conflict do nothing;

  -- Booth user 1 scans EPITECH stand
  insert into public.scans (user_id, event_id, stand_id, channel, created_at)
  values ('f1000001-0000-0000-0000-000000000001', PARIS_EVENT, stand_id_epitech, 'stand',
    '2026-04-18 09:40:00+02')
  on conflict do nothing;

  raise notice 'Demo seed complete. Student UID: %, Teacher UID: %, Exhibitor UID: %, Parent UID: %',
    STUDENT_UID, TEACHER_UID, EXHIBITOR_UID, PARENT_UID;

end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════
-- • 4 demo user profiles (student, teacher, exhibitor, parent)
-- • 1 teacher group linked to Paris event
-- • 1 complete student journey: entry→3 scans→exit (dwell=186min)
-- • 3 swipe matches (2 right, 1 left)
-- • 1 confirmed RDV at ENSAD
-- • 3 booth-registered walk-ins with entry scans
-- • parent_email set on student → parent module can read profile
-- ═══════════════════════════════════════════════════════════════════════════
