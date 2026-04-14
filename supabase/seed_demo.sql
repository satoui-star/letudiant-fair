-- ═══════════════════════════════════════════════════════════════════════════
-- L'ÉTUDIANT SALONS — Complete Demo Seed Data
-- ─────────────────────────────────────────────────────────────────────────
-- Run AFTER: schema.sql + analytics_schema.sql + all migrations + seed.sql
--
-- Prerequisites (run once if not already done):
--   ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
--   ALTER TABLE public.groups ALTER COLUMN school_name DROP NOT NULL;
--
-- Contains:
--   PART 1 — 4 demo users + Léa's journey + 3 booth walk-ins
--   PART 2 — 30 extended students (10 high / 10 medium / 10 low engagement)
--
-- After running this, run scoring_function.sql to compute lead scores.
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — Demo Users + Léa Moreau's Journey + Booth Walk-ins
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  STU uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  TEA uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  EXH uuid := 'cccccccc-0000-0000-0000-000000000001';
  PAR uuid := 'dddddddd-0000-0000-0000-000000000001';
  PARIS uuid := 'a1b2c3d4-0000-0000-0000-000000000001';
  s_epitech uuid;
  s_ensad uuid;
begin
  -- 4 demo users
  insert into public.users (id, email, name, role, education_level, bac_series, education_branches, intent_score, intent_level, is_booth_registered, optin_letudiant, optin_commercial, consent_date)
  values
    (STU, 'student@demo.fr', 'Léa Moreau', 'student', 'terminale', 'Générale', ARRAY['Art et Design','Architecture'], 65, 'medium', false, true, true, now()),
    (TEA, 'teacher@demo.fr', 'M. Dupont', 'teacher', null, null, '{}', 0, 'low', false, false, false, null),
    (EXH, 'exhibitor@demo.fr', 'Responsable EPITECH', 'exhibitor', null, null, '{}', 0, 'low', false, false, false, null),
    (PAR, 'parent@demo.fr', 'Marie Moreau', 'parent', null, null, '{}', 0, 'low', false, false, false, null)
  on conflict (id) do nothing;

  update public.users set parent_email = 'parent@demo.fr' where id = STU;

  -- Get stand IDs
  select id into s_epitech from public.stands where event_id = PARIS and school_id = 'b1b2c3d4-0000-0000-0000-000000000006' limit 1;
  select id into s_ensad from public.stands where event_id = PARIS and school_id = 'b1b2c3d4-0000-0000-0000-000000000013' limit 1;

  -- Scans: entry -> 2 stands -> conference -> exit
  insert into public.scans (user_id, event_id, channel, created_at) values (STU, PARIS, 'entry', '2026-04-18 09:12:00+02') on conflict do nothing;
  insert into public.scans (user_id, event_id, stand_id, channel, created_at) values (STU, PARIS, s_epitech, 'stand', '2026-04-18 09:35:00+02') on conflict do nothing;
  insert into public.scans (user_id, event_id, stand_id, channel, created_at) values (STU, PARIS, s_ensad, 'stand', '2026-04-18 10:10:00+02') on conflict do nothing;
  insert into public.scans (user_id, event_id, channel, created_at) values (STU, PARIS, 'conference', '2026-04-18 10:30:00+02') on conflict do nothing;
  insert into public.scans (user_id, event_id, channel, created_at) values (STU, PARIS, 'exit', '2026-04-18 12:18:00+02') on conflict do nothing;

  update public.users set last_dwell_minutes = 186 where id = STU;

  -- Matches
  insert into public.matches (student_id, school_id, student_swipe, created_at) values
    (STU, 'b1b2c3d4-0000-0000-0000-000000000013', 'right', '2026-04-18 10:15:00+02'),
    (STU, 'b1b2c3d4-0000-0000-0000-000000000001', 'right', '2026-04-18 09:55:00+02'),
    (STU, 'b1b2c3d4-0000-0000-0000-000000000002', 'left', '2026-04-18 09:50:00+02')
  on conflict do nothing;

  -- Appointment
  insert into public.appointments (student_id, school_id, event_id, slot_time, slot_duration, status, student_notes)
  values (STU, 'b1b2c3d4-0000-0000-0000-000000000013', PARIS, '2026-04-18 11:00:00+02', 15, 'confirmed', 'Intéressée par Architecture Intérieure')
  on conflict do nothing;

  -- 3 booth walk-ins
  insert into public.users (id, email, name, role, education_level, intent_score, intent_level, is_booth_registered, consent_date) values
    ('f1000001-0000-0000-0000-000000000001', 'booth1@booth.letudiant-salons.fr', 'Thomas B.', 'student', 'Terminale Générale', 5, 'low', true, '2026-04-18 09:05:00+02'),
    ('f1000002-0000-0000-0000-000000000002', 'booth2@booth.letudiant-salons.fr', 'Camille D.', 'student', 'BTS 1ère année', 5, 'low', true, '2026-04-18 09:22:00+02'),
    ('f1000003-0000-0000-0000-000000000003', 'booth3@booth.letudiant-salons.fr', 'Noé M.', 'student', 'Terminale Technologique', 5, 'low', true, '2026-04-18 10:45:00+02')
  on conflict (id) do nothing;

  insert into public.scans (user_id, event_id, channel, created_at) values
    ('f1000001-0000-0000-0000-000000000001', PARIS, 'entry', '2026-04-18 09:06:00+02'),
    ('f1000002-0000-0000-0000-000000000002', PARIS, 'entry', '2026-04-18 09:23:00+02'),
    ('f1000003-0000-0000-0000-000000000003', PARIS, 'entry', '2026-04-18 10:46:00+02')
  on conflict do nothing;

  insert into public.scans (user_id, event_id, stand_id, channel, created_at)
  values ('f1000001-0000-0000-0000-000000000001', PARIS, s_epitech, 'stand', '2026-04-18 09:40:00+02')
  on conflict do nothing;

  raise notice 'Part 1 complete: 4 demo users + Léa journey + 3 booth walk-ins';
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — 30 Extended Students (10 HIGH / 10 MEDIUM / 10 LOW)
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  PARIS uuid := 'a1b2c3d4-0000-0000-0000-000000000001';
  s_sciencespo uuid; s_hec uuid; s_centrale uuid; s_essec uuid;
  s_saclay uuid; s_epitech uuid; s_iut uuid; s_ens uuid;
  s_escp uuid; s_ensad uuid; s_boulle uuid; s_belleville uuid;
  s_strate uuid; s_polytechnique uuid; s_mines uuid;
  s_paris1 uuid; s_skema uuid;
begin
  -- Look up all Paris stand IDs
  select id into s_sciencespo from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000001' limit 1;
  select id into s_hec from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000002' limit 1;
  select id into s_centrale from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000003' limit 1;
  select id into s_essec from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000004' limit 1;
  select id into s_saclay from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000005' limit 1;
  select id into s_epitech from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000006' limit 1;
  select id into s_iut from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000007' limit 1;
  select id into s_ens from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000009' limit 1;
  select id into s_escp from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000010' limit 1;
  select id into s_ensad from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000013' limit 1;
  select id into s_boulle from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000014' limit 1;
  select id into s_belleville from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000015' limit 1;
  select id into s_strate from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000017' limit 1;
  select id into s_polytechnique from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000019' limit 1;
  select id into s_mines from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000021' limit 1;
  select id into s_paris1 from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000023' limit 1;
  select id into s_skema from stands where event_id=PARIS and school_id='b1b2c3d4-0000-0000-0000-000000000024' limit 1;

  -- ══════════════════════════════════════════════════════════════════════
  -- HIGH ENGAGEMENT (10) — score ~40-75 → deciding
  -- ══════════════════════════════════════════════════════════════════════

  -- H01: Sofia Chen — commerce/management
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000001-0000-0000-0000-000000000001','sofia.chen@demo.fr','Sofia Chen','student','terminale','Générale',ARRAY['Commerce et Marketing','Économie et Gestion'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,'entry','2026-04-18 08:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,s_hec,'stand','2026-04-18 09:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,s_essec,'stand','2026-04-18 09:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,s_escp,'stand','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,s_skema,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,s_sciencespo,'stand','2026-04-18 11:15:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,'conference','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000001-0000-0000-0000-000000000001',PARIS,'exit','2026-04-18 15:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000002','right','2026-04-18 09:10:00+02'),('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000004','right','2026-04-18 09:40:00+02'),('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000010','right','2026-04-18 10:05:00+02'),('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000024','right','2026-04-18 10:35:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000002',PARIS,'2026-04-18 13:00:00+02',15,'confirmed'),('dd000001-0000-0000-0000-000000000001','b1b2c3d4-0000-0000-0000-000000000004',PARIS,'2026-04-18 14:30:00+02',15,'confirmed') on conflict do nothing;

  -- H02: Rayan Benali — ingénieur
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000002-0000-0000-0000-000000000002','rayan.benali@demo.fr','Rayan Benali','student','terminale','Générale',ARRAY['Sciences et Technologies','Informatique et Numérique'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,'entry','2026-04-18 09:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_centrale,'stand','2026-04-18 09:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_polytechnique,'stand','2026-04-18 09:55:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_mines,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_epitech,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_saclay,'stand','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,s_iut,'stand','2026-04-18 12:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,'conference','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000002-0000-0000-0000-000000000002',PARIS,'exit','2026-04-18 16:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000002-0000-0000-0000-000000000002','b1b2c3d4-0000-0000-0000-000000000003','right','2026-04-18 09:25:00+02'),('dd000002-0000-0000-0000-000000000002','b1b2c3d4-0000-0000-0000-000000000019','right','2026-04-18 10:00:00+02'),('dd000002-0000-0000-0000-000000000002','b1b2c3d4-0000-0000-0000-000000000006','right','2026-04-18 11:05:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000002-0000-0000-0000-000000000002','b1b2c3d4-0000-0000-0000-000000000003',PARIS,'2026-04-18 13:30:00+02',15,'confirmed') on conflict do nothing;

  -- H03: Inès Dupont — art & design
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000003-0000-0000-0000-000000000003','ines.dupont@demo.fr','Inès Dupont','student','terminale','Générale',ARRAY['Art et Design','Architecture'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,'entry','2026-04-18 09:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,s_ensad,'stand','2026-04-18 09:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,s_boulle,'stand','2026-04-18 10:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,s_belleville,'stand','2026-04-18 10:50:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,s_strate,'stand','2026-04-18 11:20:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,'conference','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,'conference','2026-04-18 12:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,'conference','2026-04-18 13:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000003-0000-0000-0000-000000000003',PARIS,'exit','2026-04-18 15:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000013','right','2026-04-18 09:50:00+02'),('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000014','right','2026-04-18 10:25:00+02'),('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000015','right','2026-04-18 10:55:00+02'),('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000017','right','2026-04-18 11:25:00+02'),('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000002','left','2026-04-18 11:30:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000013',PARIS,'2026-04-18 14:00:00+02',15,'confirmed'),('dd000003-0000-0000-0000-000000000003','b1b2c3d4-0000-0000-0000-000000000014',PARIS,'2026-04-18 14:30:00+02',15,'pending') on conflict do nothing;

  -- H04: Lucas Martin — droit/sciences po
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000004-0000-0000-0000-000000000004','lucas.martin@demo.fr','Lucas Martin','student','terminale','Générale',ARRAY['Droit et Sciences Politiques'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,'entry','2026-04-18 08:50:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,s_sciencespo,'stand','2026-04-18 09:10:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,s_paris1,'stand','2026-04-18 09:50:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,s_ens,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,s_escp,'stand','2026-04-18 11:10:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,'conference','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,'conference','2026-04-18 13:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000004-0000-0000-0000-000000000004',PARIS,'exit','2026-04-18 14:45:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000004-0000-0000-0000-000000000004','b1b2c3d4-0000-0000-0000-000000000001','right','2026-04-18 09:15:00+02'),('dd000004-0000-0000-0000-000000000004','b1b2c3d4-0000-0000-0000-000000000023','right','2026-04-18 09:55:00+02'),('dd000004-0000-0000-0000-000000000004','b1b2c3d4-0000-0000-0000-000000000009','right','2026-04-18 10:35:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000004-0000-0000-0000-000000000004','b1b2c3d4-0000-0000-0000-000000000001',PARIS,'2026-04-18 11:30:00+02',15,'confirmed') on conflict do nothing;

  -- H05: Amira Kaddouri — santé
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000005-0000-0000-0000-000000000005','amira.kaddouri@demo.fr','Amira Kaddouri','student','terminale','Générale',ARRAY['Santé','Sciences et Technologies'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,'entry','2026-04-18 09:15:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,s_saclay,'stand','2026-04-18 09:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,s_centrale,'stand','2026-04-18 10:15:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,s_ens,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,s_polytechnique,'stand','2026-04-18 11:45:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,'conference','2026-04-18 15:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000005-0000-0000-0000-000000000005',PARIS,'exit','2026-04-18 16:45:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000005-0000-0000-0000-000000000005','b1b2c3d4-0000-0000-0000-000000000005','right','2026-04-18 09:35:00+02'),('dd000005-0000-0000-0000-000000000005','b1b2c3d4-0000-0000-0000-000000000003','right','2026-04-18 10:20:00+02'),('dd000005-0000-0000-0000-000000000005','b1b2c3d4-0000-0000-0000-000000000019','right','2026-04-18 11:50:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000005-0000-0000-0000-000000000005','b1b2c3d4-0000-0000-0000-000000000005',PARIS,'2026-04-18 14:00:00+02',15,'confirmed') on conflict do nothing;

  -- H06: Emma Leroy — info/numérique
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000006-0000-0000-0000-000000000006','emma.leroy@demo.fr','Emma Leroy','student','terminale','Générale',ARRAY['Informatique et Numérique'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,'entry','2026-04-18 08:55:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,s_epitech,'stand','2026-04-18 09:10:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,s_iut,'stand','2026-04-18 09:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,s_centrale,'stand','2026-04-18 10:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,s_saclay,'stand','2026-04-18 10:55:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,s_polytechnique,'stand','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000006-0000-0000-0000-000000000006',PARIS,'exit','2026-04-18 15:15:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000006-0000-0000-0000-000000000006','b1b2c3d4-0000-0000-0000-000000000006','right','2026-04-18 09:15:00+02'),('dd000006-0000-0000-0000-000000000006','b1b2c3d4-0000-0000-0000-000000000007','right','2026-04-18 09:50:00+02'),('dd000006-0000-0000-0000-000000000006','b1b2c3d4-0000-0000-0000-000000000003','right','2026-04-18 10:25:00+02'),('dd000006-0000-0000-0000-000000000006','b1b2c3d4-0000-0000-0000-000000000005','right','2026-04-18 11:00:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000006-0000-0000-0000-000000000006','b1b2c3d4-0000-0000-0000-000000000006',PARIS,'2026-04-18 12:00:00+02',15,'confirmed') on conflict do nothing;

  -- H07: Youssef Amrani — commerce international
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000007-0000-0000-0000-000000000007','youssef.amrani@demo.fr','Youssef Amrani','student','post-bac','Générale',ARRAY['Commerce et Marketing','Économie et Gestion'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,'entry','2026-04-18 09:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,s_hec,'stand','2026-04-18 09:35:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,s_escp,'stand','2026-04-18 10:10:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,s_essec,'stand','2026-04-18 10:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,s_skema,'stand','2026-04-18 11:20:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,'conference','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000007-0000-0000-0000-000000000007',PARIS,'exit','2026-04-18 14:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000007-0000-0000-0000-000000000007','b1b2c3d4-0000-0000-0000-000000000002','right','2026-04-18 09:40:00+02'),('dd000007-0000-0000-0000-000000000007','b1b2c3d4-0000-0000-0000-000000000010','right','2026-04-18 10:15:00+02'),('dd000007-0000-0000-0000-000000000007','b1b2c3d4-0000-0000-0000-000000000024','right','2026-04-18 11:25:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000007-0000-0000-0000-000000000007','b1b2c3d4-0000-0000-0000-000000000010',PARIS,'2026-04-18 12:30:00+02',15,'confirmed') on conflict do nothing;

  -- H08: Chloé Rousseau — BTS, alternance
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000008-0000-0000-0000-000000000008','chloe.rousseau@demo.fr','Chloé Rousseau','student','terminale','Technologique',ARRAY['Commerce et Marketing','Informatique et Numérique'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,'entry','2026-04-18 09:40:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,s_iut,'stand','2026-04-18 09:55:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,s_epitech,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,s_strate,'stand','2026-04-18 11:05:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,s_essec,'stand','2026-04-18 11:40:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,'conference','2026-04-18 16:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000008-0000-0000-0000-000000000008',PARIS,'exit','2026-04-18 17:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000008-0000-0000-0000-000000000008','b1b2c3d4-0000-0000-0000-000000000007','right','2026-04-18 10:00:00+02'),('dd000008-0000-0000-0000-000000000008','b1b2c3d4-0000-0000-0000-000000000006','right','2026-04-18 10:35:00+02'),('dd000008-0000-0000-0000-000000000008','b1b2c3d4-0000-0000-0000-000000000004','right','2026-04-18 11:45:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000008-0000-0000-0000-000000000008','b1b2c3d4-0000-0000-0000-000000000007',PARIS,'2026-04-18 13:00:00+02',15,'confirmed') on conflict do nothing;

  -- H09: Maxime Girard — sciences, prépa
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000009-0000-0000-0000-000000000009','maxime.girard@demo.fr','Maxime Girard','student','terminale','Générale',ARRAY['Sciences et Technologies'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,'entry','2026-04-18 08:40:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,s_polytechnique,'stand','2026-04-18 09:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,s_mines,'stand','2026-04-18 09:40:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,s_centrale,'stand','2026-04-18 10:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,s_ens,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,s_saclay,'stand','2026-04-18 11:40:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,'conference','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000009-0000-0000-0000-000000000009',PARIS,'exit','2026-04-18 15:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000009-0000-0000-0000-000000000009','b1b2c3d4-0000-0000-0000-000000000019','right','2026-04-18 09:05:00+02'),('dd000009-0000-0000-0000-000000000009','b1b2c3d4-0000-0000-0000-000000000021','right','2026-04-18 09:45:00+02'),('dd000009-0000-0000-0000-000000000009','b1b2c3d4-0000-0000-0000-000000000003','right','2026-04-18 10:25:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000009-0000-0000-0000-000000000009','b1b2c3d4-0000-0000-0000-000000000019',PARIS,'2026-04-18 13:00:00+02',15,'confirmed') on conflict do nothing;

  -- H10: Lina Petit — lettres/sciences humaines
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000010-0000-0000-0000-000000000010','lina.petit@demo.fr','Lina Petit','student','terminale','Générale',ARRAY['Lettres et Sciences Humaines','Droit et Sciences Politiques'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,'entry','2026-04-18 09:05:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,s_ens,'stand','2026-04-18 09:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,s_sciencespo,'stand','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,s_paris1,'stand','2026-04-18 10:40:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,s_ensad,'stand','2026-04-18 11:20:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,'conference','2026-04-18 13:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,'conference','2026-04-18 15:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000010-0000-0000-0000-000000000010',PARIS,'exit','2026-04-18 16:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000010-0000-0000-0000-000000000010','b1b2c3d4-0000-0000-0000-000000000009','right','2026-04-18 09:25:00+02'),('dd000010-0000-0000-0000-000000000010','b1b2c3d4-0000-0000-0000-000000000001','right','2026-04-18 10:05:00+02'),('dd000010-0000-0000-0000-000000000010','b1b2c3d4-0000-0000-0000-000000000023','right','2026-04-18 10:45:00+02') on conflict do nothing;
  insert into public.appointments(student_id,school_id,event_id,slot_time,slot_duration,status) values ('dd000010-0000-0000-0000-000000000010','b1b2c3d4-0000-0000-0000-000000000009',PARIS,'2026-04-18 14:00:00+02',15,'confirmed') on conflict do nothing;

  -- ══════════════════════════════════════════════════════════════════════
  -- MEDIUM ENGAGEMENT (10) — score ~20-39 → comparing
  -- ══════════════════════════════════════════════════════════════════════

  -- M01: Nathan Morel
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000011-0000-0000-0000-000000000011','nathan.morel@demo.fr','Nathan Morel','student','terminale','Générale',ARRAY['Économie et Gestion'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000011-0000-0000-0000-000000000011',PARIS,'entry','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000011-0000-0000-0000-000000000011',PARIS,s_hec,'stand','2026-04-18 10:20:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000011-0000-0000-0000-000000000011',PARIS,s_escp,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000011-0000-0000-0000-000000000011',PARIS,'exit','2026-04-18 12:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000011-0000-0000-0000-000000000011','b1b2c3d4-0000-0000-0000-000000000002','right','2026-04-18 10:25:00+02') on conflict do nothing;

  -- M02: Jade Fournier
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000012-0000-0000-0000-000000000012','jade.fournier@demo.fr','Jade Fournier','student','terminale','Technologique',ARRAY['Informatique et Numérique'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,'entry','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,s_epitech,'stand','2026-04-18 10:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,s_iut,'stand','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,s_saclay,'stand','2026-04-18 12:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000012-0000-0000-0000-000000000012',PARIS,'exit','2026-04-18 14:45:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000012-0000-0000-0000-000000000012','b1b2c3d4-0000-0000-0000-000000000006','right','2026-04-18 10:50:00+02'),('dd000012-0000-0000-0000-000000000012','b1b2c3d4-0000-0000-0000-000000000007','right','2026-04-18 11:35:00+02') on conflict do nothing;

  -- M03: Hugo Bernard
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000013-0000-0000-0000-000000000013','hugo.bernard@demo.fr','Hugo Bernard','student','terminale','Générale',ARRAY['Sciences et Technologies'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000013-0000-0000-0000-000000000013',PARIS,'entry','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000013-0000-0000-0000-000000000013',PARIS,s_centrale,'stand','2026-04-18 11:15:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000013-0000-0000-0000-000000000013',PARIS,s_mines,'stand','2026-04-18 11:50:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000013-0000-0000-0000-000000000013',PARIS,'exit','2026-04-18 13:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000013-0000-0000-0000-000000000013','b1b2c3d4-0000-0000-0000-000000000003','right','2026-04-18 11:20:00+02'),('dd000013-0000-0000-0000-000000000013','b1b2c3d4-0000-0000-0000-000000000021','right','2026-04-18 11:55:00+02') on conflict do nothing;

  -- M04: Manon Dubois
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000014-0000-0000-0000-000000000014','manon.dubois@demo.fr','Manon Dubois','student','terminale','Générale',ARRAY['Droit et Sciences Politiques','Lettres et Sciences Humaines'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000014-0000-0000-0000-000000000014',PARIS,'entry','2026-04-18 09:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000014-0000-0000-0000-000000000014',PARIS,s_sciencespo,'stand','2026-04-18 09:50:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000014-0000-0000-0000-000000000014',PARIS,s_paris1,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000014-0000-0000-0000-000000000014',PARIS,'conference','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000014-0000-0000-0000-000000000014',PARIS,'exit','2026-04-18 12:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000014-0000-0000-0000-000000000014','b1b2c3d4-0000-0000-0000-000000000001','right','2026-04-18 09:55:00+02') on conflict do nothing;

  -- M05: Théo Lambert
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000015-0000-0000-0000-000000000015','theo.lambert@demo.fr','Théo Lambert','student','terminale','Professionnelle',ARRAY['Commerce et Marketing'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000015-0000-0000-0000-000000000015',PARIS,'entry','2026-04-18 10:15:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000015-0000-0000-0000-000000000015',PARIS,s_iut,'stand','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000015-0000-0000-0000-000000000015',PARIS,s_essec,'stand','2026-04-18 11:15:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000015-0000-0000-0000-000000000015',PARIS,'exit','2026-04-18 12:15:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000015-0000-0000-0000-000000000015','b1b2c3d4-0000-0000-0000-000000000007','right','2026-04-18 10:35:00+02') on conflict do nothing;

  -- M06: Sarah Cohen
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000016-0000-0000-0000-000000000016','sarah.cohen@demo.fr','Sarah Cohen','student','terminale','Générale',ARRAY['Art et Design'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000016-0000-0000-0000-000000000016',PARIS,'entry','2026-04-18 09:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000016-0000-0000-0000-000000000016',PARIS,s_ensad,'stand','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000016-0000-0000-0000-000000000016',PARIS,s_boulle,'stand','2026-04-18 10:40:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000016-0000-0000-0000-000000000016',PARIS,'exit','2026-04-18 12:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000016-0000-0000-0000-000000000016','b1b2c3d4-0000-0000-0000-000000000013','right','2026-04-18 10:05:00+02'),('dd000016-0000-0000-0000-000000000016','b1b2c3d4-0000-0000-0000-000000000014','right','2026-04-18 10:45:00+02') on conflict do nothing;

  -- M07: Karim Bensaid
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000017-0000-0000-0000-000000000017','karim.bensaid@demo.fr','Karim Bensaid','student','post-bac','Générale',ARRAY['Informatique et Numérique','Sciences et Technologies'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000017-0000-0000-0000-000000000017',PARIS,'entry','2026-04-18 11:30:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000017-0000-0000-0000-000000000017',PARIS,s_epitech,'stand','2026-04-18 11:45:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000017-0000-0000-0000-000000000017',PARIS,'conference','2026-04-18 14:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000017-0000-0000-0000-000000000017',PARIS,'exit','2026-04-18 15:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000017-0000-0000-0000-000000000017','b1b2c3d4-0000-0000-0000-000000000006','right','2026-04-18 11:50:00+02') on conflict do nothing;

  -- M08: Clara Fontaine
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000018-0000-0000-0000-000000000018','clara.fontaine@demo.fr','Clara Fontaine','student','terminale','Générale',ARRAY['Santé'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000018-0000-0000-0000-000000000018',PARIS,'entry','2026-04-18 09:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000018-0000-0000-0000-000000000018',PARIS,s_saclay,'stand','2026-04-18 09:20:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000018-0000-0000-0000-000000000018',PARIS,'exit','2026-04-18 11:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000018-0000-0000-0000-000000000018','b1b2c3d4-0000-0000-0000-000000000005','right','2026-04-18 09:25:00+02') on conflict do nothing;

  -- M09: Antoine Mercier
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000019-0000-0000-0000-000000000019','antoine.mercier@demo.fr','Antoine Mercier','student','terminale','Générale',ARRAY['Économie et Gestion','Commerce et Marketing'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000019-0000-0000-0000-000000000019',PARIS,'entry','2026-04-18 10:45:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000019-0000-0000-0000-000000000019',PARIS,s_skema,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000019-0000-0000-0000-000000000019',PARIS,s_hec,'stand','2026-04-18 11:40:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000019-0000-0000-0000-000000000019',PARIS,s_essec,'stand','2026-04-18 12:20:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000019-0000-0000-0000-000000000019',PARIS,'exit','2026-04-18 13:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000019-0000-0000-0000-000000000019','b1b2c3d4-0000-0000-0000-000000000024','right','2026-04-18 11:05:00+02'),('dd000019-0000-0000-0000-000000000019','b1b2c3d4-0000-0000-0000-000000000002','right','2026-04-18 11:45:00+02') on conflict do nothing;

  -- M10: Zoé Richard
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000020-0000-0000-0000-000000000020','zoe.richard@demo.fr','Zoé Richard','student','terminale','Générale',ARRAY['Lettres et Sciences Humaines'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000020-0000-0000-0000-000000000020',PARIS,'entry','2026-04-18 10:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000020-0000-0000-0000-000000000020',PARIS,s_ens,'stand','2026-04-18 10:15:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000020-0000-0000-0000-000000000020',PARIS,s_paris1,'stand','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000020-0000-0000-0000-000000000020',PARIS,'conference','2026-04-18 13:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000020-0000-0000-0000-000000000020',PARIS,'exit','2026-04-18 14:00:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000020-0000-0000-0000-000000000020','b1b2c3d4-0000-0000-0000-000000000009','right','2026-04-18 10:20:00+02') on conflict do nothing;

  -- ══════════════════════════════════════════════════════════════════════
  -- LOW ENGAGEMENT (10) — score ~5-19 → exploring
  -- ══════════════════════════════════════════════════════════════════════

  -- L01-L04: No-shows (registered but never came)
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values
    ('dd000021-0000-0000-0000-000000000021','paul.roux@demo.fr','Paul Roux','student','terminale','Générale',ARRAY['Sciences et Technologies'],0,'low',false,false,now()),
    ('dd000022-0000-0000-0000-000000000022','leonie.garcia@demo.fr','Léonie Garcia','student','terminale','Technologique',ARRAY['Commerce et Marketing'],0,'low',false,false,now()),
    ('dd000023-0000-0000-0000-000000000023','mathis.lefevre@demo.fr','Mathis Lefevre','student','terminale','Professionnelle',ARRAY['Informatique et Numérique'],0,'low',false,false,now()),
    ('dd000024-0000-0000-0000-000000000024','mia.bonnet@demo.fr','Mia Bonnet','student','terminale','Générale',ARRAY['Santé'],0,'low',false,false,now())
  on conflict(id) do nothing;

  -- L05: Raphaël Blanc — came 20 min
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000025-0000-0000-0000-000000000025','raphael.blanc@demo.fr','Raphaël Blanc','student','terminale','Générale',ARRAY['Sciences et Technologies'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000025-0000-0000-0000-000000000025',PARIS,'entry','2026-04-18 11:00:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000025-0000-0000-0000-000000000025',PARIS,'exit','2026-04-18 11:20:00+02');

  -- L06: Camille Faure — entry + 1 stand
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000026-0000-0000-0000-000000000026','camille.faure@demo.fr','Camille Faure','student','terminale','Générale',ARRAY['Art et Design'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000026-0000-0000-0000-000000000026',PARIS,'entry','2026-04-18 13:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000026-0000-0000-0000-000000000026',PARIS,s_ensad,'stand','2026-04-18 13:15:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000026-0000-0000-0000-000000000026',PARIS,'exit','2026-04-18 13:45:00+02');

  -- L07: Gabriel Simon — entry only
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000027-0000-0000-0000-000000000027','gabriel.simon@demo.fr','Gabriel Simon','student','terminale','Technologique',ARRAY['Sciences et Technologies'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000027-0000-0000-0000-000000000027',PARIS,'entry','2026-04-18 14:00:00+02');

  -- L08: Louise Michel — entry + 1 swipe
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000028-0000-0000-0000-000000000028','louise.michel@demo.fr','Louise Michel','student','terminale','Générale',ARRAY['Droit et Sciences Politiques'],0,'low',false,true,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000028-0000-0000-0000-000000000028',PARIS,'entry','2026-04-18 10:30:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000028-0000-0000-0000-000000000028',PARIS,'exit','2026-04-18 11:30:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000028-0000-0000-0000-000000000028','b1b2c3d4-0000-0000-0000-000000000001','right','2026-04-18 10:45:00+02') on conflict do nothing;

  -- L09: Adam Duval — no show
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000029-0000-0000-0000-000000000029','adam.duval@demo.fr','Adam Duval','student','terminale','Professionnelle',ARRAY['Économie et Gestion'],0,'low',false,false,now()) on conflict(id) do nothing;

  -- L10: Eva Ndiaye — entry + 1 stand + 1 swipe left
  insert into public.users (id,email,name,role,education_level,bac_series,education_branches,intent_score,intent_level,is_booth_registered,optin_letudiant,consent_date) values ('dd000030-0000-0000-0000-000000000030','eva.ndiaye@demo.fr','Eva Ndiaye','student','terminale','Générale',ARRAY['Lettres et Sciences Humaines'],0,'low',false,false,now()) on conflict(id) do nothing;
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000030-0000-0000-0000-000000000030',PARIS,'entry','2026-04-18 12:00:00+02');
  insert into public.scans(user_id,event_id,stand_id,channel,created_at) values ('dd000030-0000-0000-0000-000000000030',PARIS,s_ens,'stand','2026-04-18 12:15:00+02');
  insert into public.scans(user_id,event_id,channel,created_at) values ('dd000030-0000-0000-0000-000000000030',PARIS,'exit','2026-04-18 12:45:00+02');
  insert into public.matches(student_id,school_id,student_swipe,created_at) values ('dd000030-0000-0000-0000-000000000030','b1b2c3d4-0000-0000-0000-000000000009','left','2026-04-18 12:20:00+02') on conflict do nothing;

  raise notice 'Part 2 complete: 30 extended students created!';
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════
-- Part 1: 4 demo users (student, teacher, exhibitor, parent) + 3 booth walk-ins
-- Part 2: 30 students (10 high / 10 medium / 10 low engagement)
-- Total: 37 users, ~146 scans, ~53 matches, ~13 appointments
-- Next step: run scoring_function.sql to populate the leads table
-- ═══════════════════════════════════════════════════════════════════════════