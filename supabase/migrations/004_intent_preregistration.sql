-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004 — Intent Level + Pre-Registrations (Eventmaker sync target)
-- Run in Supabase SQL Editor after migrations 002 and 003
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add intent tracking columns to users
alter table public.users
  add column if not exists intent_score integer not null default 0,
  add column if not exists intent_level text    not null default 'low'
    check (intent_level in ('low', 'medium', 'high'));

-- 2. Pre-registrations table
--    Populated by Eventmaker webhook (or mock). Resolved when student registers in app.
create table if not exists public.pre_registrations (
  id                          uuid        primary key default uuid_generate_v4(),
  email                       text        not null unique,
  first_name                  text        not null,
  last_name                   text        not null,
  education_level             text,
  bac_series                  text,
  postal_code                 text,
  declared_domains            text[]      default '{}',
  event_id                    uuid        not null references public.events(id),
  eventmaker_registration_id  text        unique,
  registered_at               timestamptz not null default now(),
  resolved_user_id            uuid        references auth.users(id),
  resolved_at                 timestamptz,
  created_at                  timestamptz default now()
);

alter table public.pre_registrations enable row level security;

-- Service role can do everything (webhook + admin)
create policy "Service manages pre_registrations"
  on public.pre_registrations for all
  using (true) with check (true);

-- Students can read their own resolved record
create policy "Students read own pre_registration"
  on public.pre_registrations for select
  using (resolved_user_id = auth.uid());

-- 3. Fix groups RLS
--    Allow public SELECT on groups so the group-invite page can look up by token.
--    member_uids contains only UUIDs (non-guessable) — no student PII exposed.
drop policy if exists "Teacher sees own group"    on public.groups;
drop policy if exists "Teacher manages own group" on public.groups;

create policy "Teacher manages own group"
  on public.groups for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Anyone can lookup group by invite_link"
  on public.groups for select
  using (true);

-- 4. Performance indexes
create index if not exists idx_groups_invite_link  on public.groups(invite_link);
create index if not exists idx_pre_reg_email       on public.pre_registrations(email);
create index if not exists idx_pre_reg_event       on public.pre_registrations(event_id);
create index if not exists idx_users_intent_level  on public.users(intent_level);
create index if not exists idx_users_intent_score  on public.users(intent_score);
