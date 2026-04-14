-- ═══════════════════════════════════════════════════════════════════════════
-- L'ÉTUDIANT SALONS — Supabase Schema + Seed Data (MVP)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fembpkkczgbwacdackte/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('student', 'teacher', 'exhibitor', 'admin', 'parent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type orientation_stage as enum ('exploring', 'comparing', 'deciding');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scan_channel as enum ('entry', 'stand', 'conference', 'exit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type swipe_direction as enum ('right', 'left');
exception when duplicate_object then null; end $$;

-- ─── USERS ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  name text not null default '',
  role user_role not null default 'student',
  dob date,
  education_level text,
  bac_series text,
  postal_code text,
  education_branches text[] default '{}',
  study_wishes text[] default '{}',
  wishlist text[] default '{}',
  optin_letudiant boolean default false,
  optin_commercial boolean default false,
  optin_wax boolean default false,
  consent_date timestamptz,
  parent_approved boolean default false,
  is_minor boolean default false,
  guardian_id uuid references public.users(id),
  group_id uuid,
  orientation_score integer default 0,
  orientation_stage orientation_stage default 'exploring',
  client_id_btoc text,
  eventmaker_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null,
  event_date date not null,
  venue_map text,
  address text,
  description text,
  is_virtual boolean default false,
  created_at timestamptz default now()
);

-- ─── SCHOOLS ──────────────────────────────────────────────────────────────────
create table if not exists public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  city text not null,
  website text,
  cover_image_url text,
  reel_url text,
  description text,
  target_levels text[] default '{}',
  target_fields text[] default '{}',
  target_regions text[] default '{}',
  nb_accepted_bac_g integer,
  nb_accepted_bac_t integer,
  nb_accepted_bac_p integer,
  rate_professional_insertion numeric(5,2),
  tuition_fee integer,
  apprenticeship boolean default false,
  parcoursup boolean default true,
  scholarship_allowed boolean default false,
  created_at timestamptz default now()
);

-- ─── FORMATIONS ───────────────────────────────────────────────────────────────
create table if not exists public.formations (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  duration text not null,
  level text not null,
  fields text[] default '{}',
  admission_requirements text,
  rncp_code text,
  study_modality text,
  cost integer,
  created_at timestamptz default now()
);

-- ─── STANDS ───────────────────────────────────────────────────────────────────
create table if not exists public.stands (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  location_x integer default 0,
  location_y integer default 0,
  category text not null,
  created_at timestamptz default now()
);

-- ─── SESSIONS ─────────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  speaker_school_id uuid references public.schools(id),
  room text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text,
  created_at timestamptz default now()
);

-- ─── SCANS ────────────────────────────────────────────────────────────────────
create table if not exists public.scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_id uuid not null references public.events(id),
  stand_id uuid references public.stands(id),
  session_id uuid references public.sessions(id),
  channel scan_channel not null,
  dwell_estimate integer,
  created_at timestamptz default now()
);

-- ─── LEADS ────────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  event_id uuid not null references public.events(id),
  education_level text not null,
  education_branches text[] default '{}',
  study_wishes text[] default '{}',
  stands_visited text[] default '{}',
  confs_attended text[] default '{}',
  dwell_minutes integer default 0,
  swipe_result boolean default false,
  score_value integer default 0,
  score_tier orientation_stage default 'exploring',
  score_computed_at timestamptz default now(),
  exported_by text,
  exported_at timestamptz,
  created_at timestamptz default now(),
  unique(student_id, school_id, event_id)
);

-- ─── MATCHES ──────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_swipe swipe_direction,
  school_interest boolean default false,
  appointment_booked boolean default false,
  created_at timestamptz default now(),
  unique(student_id, school_id)
);

-- ─── GROUPS ───────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  school_name text not null,
  fair_id uuid not null references public.events(id),
  invite_link text not null unique,
  invite_link_expiry timestamptz not null,
  member_uids uuid[] default '{}',
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.schools enable row level security;
alter table public.formations enable row level security;
alter table public.stands enable row level security;
alter table public.sessions enable row level security;
alter table public.scans enable row level security;
alter table public.leads enable row level security;
alter table public.matches enable row level security;
alter table public.groups enable row level security;

-- Public read on events and schools (no auth required to browse)
create policy "Events are public" on public.events for select using (true);
create policy "Schools are public" on public.schools for select using (true);
create policy "Formations are public" on public.formations for select using (true);
create policy "Sessions are public" on public.sessions for select using (true);
create policy "Stands are public" on public.stands for select using (true);

-- Users own their data
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Scans: users see own scans
create policy "Users see own scans" on public.scans for select using (auth.uid() = user_id);
create policy "Users insert own scans" on public.scans for insert with check (auth.uid() = user_id);

-- Matches: users see own matches
create policy "Users see own matches" on public.matches for select using (auth.uid() = student_id);
create policy "Users upsert own matches" on public.matches for insert with check (auth.uid() = student_id);
create policy "Users update own matches" on public.matches for update using (auth.uid() = student_id);

-- Leads: students see own, exhibitors see for their school
create policy "Students see own leads" on public.leads for select using (auth.uid() = student_id);

-- Groups: teacher sees own group
create policy "Teacher sees own group" on public.groups for select using (auth.uid() = teacher_id);
create policy "Teacher manages own group" on public.groups for all using (auth.uid() = teacher_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — Fake MVP Data for Testing
-- ═══════════════════════════════════════════════════════════════════════════

-- Events
insert into public.events (id, name, city, event_date, address, description) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Salon de l''Étudiant Paris', 'Paris', '2026-04-18', 'Palais des Congrès, Porte Maillot', 'Le plus grand salon d''orientation de France'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Salon de l''Étudiant Lyon', 'Lyon', '2026-05-09', 'Centre de Congrès de Lyon', 'Rencontrez 180 établissements du supérieur'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Salon de l''Étudiant Bordeaux', 'Bordeaux', '2026-05-23', 'Parc des Expositions de Bordeaux', 'Orientation et formations dans le Sud-Ouest')
on conflict (id) do nothing;

-- Schools
insert into public.schools (id, name, type, city, website, description, target_levels, target_fields, target_regions, nb_accepted_bac_g, nb_accepted_bac_t, nb_accepted_bac_p, rate_professional_insertion, tuition_fee, apprenticeship, parcoursup, scholarship_allowed) values
  ('b1b2c3d4-0000-0000-0000-000000000001', 'Sciences Po Paris', 'Grande École', 'Paris', 'https://sciencespo.fr', 'École de sciences politiques et de gouvernance mondiale', ARRAY['terminale', 'post-bac'], ARRAY['Droit et Sciences Politiques', 'Économie et Gestion'], ARRAY['Île-de-France'], 180, 20, 15, 94.5, 14200, false, true, true),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'HEC Paris', 'Grande École', 'Jouy-en-Josas', 'https://hec.fr', 'L''une des meilleures écoles de management au monde', ARRAY['post-bac', 'bac+2'], ARRAY['Économie et Gestion', 'Commerce et Marketing'], ARRAY['Île-de-France'], 150, 10, 5, 98.0, 16500, false, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'CentraleSupélec', 'École d''Ingénieurs', 'Gif-sur-Yvette', 'https://centralesupelec.fr', 'Grande école d''ingénieurs généralistes de référence', ARRAY['post-bac', 'bac+2'], ARRAY['Sciences et Technologies', 'Informatique et Numérique'], ARRAY['Île-de-France'], 200, 50, 10, 97.0, 3770, false, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000004', 'ESSEC Business School', 'Grande École', 'Cergy', 'https://essec.edu', 'École de management internationale reconnue mondialement', ARRAY['post-bac', 'bac+2'], ARRAY['Commerce et Marketing', 'Économie et Gestion'], ARRAY['Île-de-France', 'International'], 120, 15, 8, 96.0, 15800, true, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'Université Paris-Saclay', 'Université', 'Gif-sur-Yvette', 'https://universite-paris-saclay.fr', 'Première université française selon les classements mondiaux', ARRAY['terminale', 'post-bac', 'bac+2', 'bac+3'], ARRAY['Sciences et Technologies', 'Santé', 'Informatique et Numérique'], ARRAY['Île-de-France'], 350, 80, 60, 89.0, 170, false, true, true),
  ('b1b2c3d4-0000-0000-0000-000000000006', 'EPITECH', 'École Spécialisée', 'Paris', 'https://epitech.eu', 'École de l''innovation et de l''expertise informatique', ARRAY['terminale', 'post-bac'], ARRAY['Informatique et Numérique'], ARRAY['National'], 400, 100, 50, 95.0, 8350, true, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000007', 'IUT Paris-Rives de Seine', 'IUT', 'Paris', 'https://iut.parisdescartes.fr', 'Institut Universitaire de Technologie pluridisciplinaire', ARRAY['terminale', 'post-bac'], ARRAY['Informatique et Numérique', 'Commerce et Marketing', 'Sciences et Technologies'], ARRAY['Île-de-France'], 200, 150, 100, 87.0, 170, true, true, true),
  ('b1b2c3d4-0000-0000-0000-000000000008', 'INSEAD', 'Grande École', 'Fontainebleau', 'https://insead.edu', 'L''école de business la plus internationale au monde', ARRAY['bac+5'], ARRAY['Économie et Gestion', 'Commerce et Marketing'], ARRAY['International'], 50, 5, 5, 99.0, 92000, false, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000009', 'École Normale Supérieure', 'Grande École', 'Paris', 'https://ens.fr', 'Former les chercheurs et enseignants de demain', ARRAY['post-bac', 'bac+2'], ARRAY['Lettres et Sciences Humaines', 'Sciences et Technologies'], ARRAY['Île-de-France'], 80, 10, 5, 92.0, 0, false, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000010', 'ESCP Business School', 'Grande École', 'Paris', 'https://escp.eu', 'La plus ancienne école de commerce du monde', ARRAY['post-bac', 'bac+2'], ARRAY['Commerce et Marketing', 'Économie et Gestion'], ARRAY['Île-de-France', 'International'], 130, 12, 6, 95.5, 14900, true, false, false),
  ('b1b2c3d4-0000-0000-0000-000000000011', 'Université de Bordeaux', 'Université', 'Bordeaux', 'https://u-bordeaux.fr', 'Grande université pluridisciplinaire du Sud-Ouest', ARRAY['terminale', 'post-bac', 'bac+2', 'bac+3'], ARRAY['Santé', 'Droit et Sciences Politiques', 'Sciences et Technologies'], ARRAY['Nouvelle-Aquitaine'], 400, 100, 80, 85.0, 170, false, true, true),
  ('b1b2c3d4-0000-0000-0000-000000000012', 'emlyon business school', 'Grande École', 'Lyon', 'https://em-lyon.com', 'École de management entrepreneuriale et internationale', ARRAY['post-bac', 'bac+2'], ARRAY['Commerce et Marketing', 'Économie et Gestion'], ARRAY['Auvergne-Rhône-Alpes'], 110, 15, 10, 93.0, 14500, true, false, false)
on conflict (id) do nothing;

-- Formations
insert into public.formations (school_id, name, duration, level, fields, admission_requirements, rncp_code, study_modality, cost) values
  ('b1b2c3d4-0000-0000-0000-000000000001', 'Bachelor en Sciences Politiques', '3 ans', 'Licence', ARRAY['Droit et Sciences Politiques'], 'Concours d''entrée + dossier', 'RNCP35178', 'Présentiel', 14200),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'Master Affaires Européennes', '2 ans', 'Master', ARRAY['Droit et Sciences Politiques', 'Économie et Gestion'], 'Bac+3 en sciences sociales', 'RNCP35179', 'Présentiel', 14200),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'Grande École Programme', '3 ans', 'Master', ARRAY['Économie et Gestion'], 'Classe prépa ou admissions parallèles', 'RNCP35180', 'Présentiel', 16500),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'Diplôme d''Ingénieur', '5 ans', 'Master', ARRAY['Sciences et Technologies', 'Informatique et Numérique'], 'Classe prépa MP/PC/PSI', 'RNCP35181', 'Présentiel', 3770),
  ('b1b2c3d4-0000-0000-0000-000000000006', 'Expert en Technologies de l''Information', '5 ans', 'Master', ARRAY['Informatique et Numérique'], 'Baccalauréat toutes séries', 'RNCP31118', 'Présentiel + Projets', 8350),
  ('b1b2c3d4-0000-0000-0000-000000000007', 'BUT Informatique', '3 ans', 'BUT', ARRAY['Informatique et Numérique'], 'Baccalauréat + Parcoursup', 'RNCP35028', 'Présentiel', 170),
  ('b1b2c3d4-0000-0000-0000-000000000007', 'BUT Techniques de Commercialisation', '3 ans', 'BUT', ARRAY['Commerce et Marketing'], 'Baccalauréat + Parcoursup', 'RNCP35029', 'Présentiel + Alternance', 170),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'Licence Sciences', '3 ans', 'Licence', ARRAY['Sciences et Technologies'], 'Baccalauréat scientifique', 'RNCP35030', 'Présentiel', 170),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'Master Informatique', '2 ans', 'Master', ARRAY['Informatique et Numérique'], 'Licence informatique ou équivalent', 'RNCP35031', 'Présentiel', 243),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'PASS - Parcours Accès Santé Spécifique', '1 an', 'Licence', ARRAY['Santé'], 'Baccalauréat + Parcoursup', 'RNCP35032', 'Présentiel', 170)
on conflict do nothing;

-- Stands for Paris event
insert into public.stands (event_id, school_id, location_x, location_y, category) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', 100, 150, 'Sciences Po & IEP'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000002', 200, 150, 'Écoles de Commerce'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000003', 300, 150, 'Écoles d''Ingénieurs'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000004', 400, 150, 'Écoles de Commerce'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000005', 500, 150, 'Universités'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000006', 100, 300, 'Écoles Spécialisées'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000007', 200, 300, 'IUT & BTS'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000009', 300, 300, 'Grandes Écoles'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000010', 400, 300, 'Écoles de Commerce')
on conflict do nothing;

-- Sessions (conferences) for Paris event
insert into public.sessions (event_id, title, speaker_school_id, room, start_time, end_time, description) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comment choisir sa voie après le bac ?', 'b1b2c3d4-0000-0000-0000-000000000001', 'Salle A - Conférence', '2026-04-18T10:00:00+02:00', '2026-04-18T11:00:00+02:00', 'Les clés pour construire son projet d''orientation'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Intégrer une grande école de commerce', 'b1b2c3d4-0000-0000-0000-000000000002', 'Salle B - Amphithéâtre', '2026-04-18T11:30:00+02:00', '2026-04-18T12:30:00+02:00', 'Prépas, admissions parallèles, BS : toutes les voies'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Les métiers du numérique : formations et débouchés', 'b1b2c3d4-0000-0000-0000-000000000006', 'Salle C - Digital', '2026-04-18T14:00:00+02:00', '2026-04-18T15:00:00+02:00', 'Dev, data, cybersécurité : le marché recrute'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Parcoursup : stratégie et vœux', NULL, 'Salle A - Conférence', '2026-04-18T15:30:00+02:00', '2026-04-18T16:30:00+02:00', 'Comment optimiser ses 10 vœux Parcoursup'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Financer ses études : bourses, prêts, alternance', NULL, 'Salle B - Amphithéâtre', '2026-04-18T16:30:00+02:00', '2026-04-18T17:30:00+02:00', 'Toutes les solutions pour financer son parcours')
on conflict do nothing;

-- Stands for Lyon event
insert into public.stands (event_id, school_id, location_x, location_y, category) values
  ('a1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000012', 100, 150, 'Écoles de Commerce'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000011', 200, 150, 'Universités')
on conflict do nothing;

-- Stands for Bordeaux event
insert into public.stands (event_id, school_id, location_x, location_y, category) values
  ('a1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000011', 100, 150, 'Universités')
on conflict do nothing;
