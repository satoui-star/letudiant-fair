-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003 — Collecte hors-app : visiteurs sans compte
-- Run AFTER 002_appointments_consent.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── SESSIONS ANONYMES ────────────────────────────────────────────────────
-- Créée dès le premier scan QR, même sans email.
-- session_token = UUID généré côté client (localStorage + cookie httpOnly)
create table if not exists public.guest_sessions (
  id               uuid primary key default uuid_generate_v4(),
  session_token    text not null unique,        -- UUID stocké en cookie navigateur
  event_id         uuid not null references public.events(id),
  is_minor         boolean default false,        -- déclaré via question d'âge (vérification déclarative)
  declared_level   text,                         -- Terminale / BTS / Licence...
  declared_domain  text,                         -- domaine d'intérêt (M1 : plan personnalisé)
  declared_region  text,                         -- département / région (M1)
  device_hint      text,                         -- hash SHA-256 du user-agent (non PII)
  first_seen_at    timestamptz default now(),
  last_seen_at     timestamptz default now(),
  resolved_user_id uuid references public.users(id)  -- rempli si identité résolue via job J+1
);

-- ─── SCANS DES VISITEURS HORS-APP ─────────────────────────────────────────
-- Chaque stand / conférence scannée par un visiteur sans app crée une ligne ici.
create table if not exists public.guest_scans (
  id               uuid primary key default uuid_generate_v4(),
  session_id       uuid not null references public.guest_sessions(id) on delete cascade,
  event_id         uuid not null references public.events(id),
  school_id        uuid references public.schools(id),    -- null si conférence générale sans école
  session_conf_id  uuid references public.sessions(id),   -- null si stand (non conférence)
  mechanism        text check (mechanism in (
    'map_qr',        -- M1 : plan personnalisé entrée
    'brochure_qr',   -- M2 : échange brochure digitale
    'conf_checkin',  -- M3 : check-in conférence
    'kiosk'          -- M4 : borne score d'orientation
  )),
  incentive_served text,        -- ex: 'brochure_ensad_2026.pdf', 'slides_orientation.pdf'
  email_captured   boolean default false,
  scanned_at       timestamptz default now()
);

-- ─── LEADS HORS-APP IDENTIFIÉS (email collecté) ───────────────────────────
-- Créé dès qu'un email est fourni via M2, M3 ou M4.
-- Peut coexister avec un users.id si l'email matche un compte existant.
create table if not exists public.guest_leads (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           uuid references public.guest_sessions(id),
  email                text not null,
  first_name           text,
  is_minor             boolean default false,
  -- RGPD consent fields (chaque optin est distinct — non-bundling)
  optin_letudiant      boolean default false,     -- newsletter L'Étudiant
  optin_wax            boolean default false,     -- recommandations WAX partenaires
  consent_ip_hash      text,                      -- SHA-256 de l'IP (non PII direct)
  consent_date         timestamptz default now(),
  consent_version      text not null default '1.0',
  -- Profil déclaratif (collecté via M4 kiosque ou formulaire enrichi M2)
  declared_level       text,                      -- Terminale / BTS / Licence...
  declared_bac_series  text,                      -- G / T / P
  declared_domains     text[] default '{}',       -- max 3 filières choisies
  declared_region      text,                      -- région d'études souhaitée
  wants_alternance     boolean,
  -- Scoring (calculé en J+1 par Edge Function)
  orientation_score    integer,                   -- 0-100, null si profil trop incomplet
  recap_email_sent_at  timestamptz,               -- null = pas encore envoyé
  -- Résolution d'identité
  resolved_user_id     uuid references public.users(id),  -- rempli si conversion vers compte app
  created_at           timestamptz default now(),
  unique nulls not distinct (email, session_id)
);

-- ─── INDEX ────────────────────────────────────────────────────────────────
create index if not exists idx_guest_sessions_token    on public.guest_sessions(session_token);
create index if not exists idx_guest_sessions_event    on public.guest_sessions(event_id);
create index if not exists idx_guest_sessions_resolved on public.guest_sessions(resolved_user_id) where resolved_user_id is not null;
create index if not exists idx_guest_scans_session     on public.guest_scans(session_id);
create index if not exists idx_guest_scans_school      on public.guest_scans(school_id);
create index if not exists idx_guest_scans_event       on public.guest_scans(event_id, mechanism);
create index if not exists idx_guest_leads_email       on public.guest_leads(email);
create index if not exists idx_guest_leads_resolved    on public.guest_leads(resolved_user_id) where resolved_user_id is not null;
create index if not exists idx_guest_leads_recap       on public.guest_leads(recap_email_sent_at) where recap_email_sent_at is null;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- INSERT public (non authentifié = scan QR depuis un mobile sans compte)
-- SELECT/UPDATE réservé service_role (admin backend, Edge Functions)
alter table public.guest_sessions enable row level security;
alter table public.guest_scans    enable row level security;
alter table public.guest_leads    enable row level security;

-- Création de session anonyme : ouverte à tous (non authentifié)
create policy "Public can create guest sessions"
  on public.guest_sessions for insert with check (true);

-- Mise à jour last_seen et résolution : service_role only (Edge Function)
-- Pas de policy UPDATE public intentionnellement.

-- Enregistrement d'un scan : ouvert à tous
create policy "Public can record guest scans"
  on public.guest_scans for insert with check (true);

-- Création d'un lead (email fourni) : ouvert à tous
create policy "Public can create guest leads"
  on public.guest_leads for insert with check (true);

-- ─── PURGE CRON (commenté — activer via pg_cron en prod) ─────────────────
-- Suppression automatique des sessions anonymes non résolues après 6 mois
-- SELECT cron.schedule('purge-anonymous-sessions', '0 3 * * 0',
--   $$DELETE FROM public.guest_sessions
--     WHERE resolved_user_id IS NULL
--       AND first_seen_at < now() - interval '6 months'$$);

-- Suppression des guest_leads non résolus après 3 ans
-- SELECT cron.schedule('purge-guest-leads', '0 4 1 * *',
--   $$DELETE FROM public.guest_leads
--     WHERE resolved_user_id IS NULL
--       AND created_at < now() - interval '3 years'$$);

-- ─── VUE EXPOSANT (anonymisée) ────────────────────────────────────────────
-- Donne aux exposants le compte de leads par stand sans exposer les emails
create or replace view public.exhibitor_guest_stats as
select
  gs.school_id,
  sc.name                                        as school_name,
  gs.event_id,
  count(distinct gs.session_id)                 as total_scans,
  count(distinct gl.id)                         as identified_leads,
  count(distinct gl.id) filter (where gl.optin_wax)   as wax_optins,
  avg(gl.orientation_score)                     as avg_score,
  max(gs.scanned_at)                            as last_scan_at
from public.guest_scans gs
left join public.schools sc on sc.id = gs.school_id
left join public.guest_sessions sess on sess.id = gs.session_id
left join public.guest_leads gl on gl.session_id = gs.session_id
where gs.school_id is not null
group by gs.school_id, sc.name, gs.event_id;

comment on view public.exhibitor_guest_stats is
  'Statistiques agrégées hors-app par école/événement — aucun email exposé dans cette vue.';
