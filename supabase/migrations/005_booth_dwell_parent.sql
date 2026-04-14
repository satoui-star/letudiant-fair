-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005 — Booth Registration · Dwell Time · Parent Module
-- Run in Supabase SQL Editor after migrations 001–004
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add booth + dwell + parent columns to users
alter table public.users
  add column if not exists is_booth_registered boolean    not null default false,
  add column if not exists last_dwell_minutes  integer,
  add column if not exists parent_email        text,
  add column if not exists school_name         text;       -- teachers: their school

-- 2. Indexes for common look-ups
create index if not exists idx_users_booth      on public.users(is_booth_registered) where is_booth_registered = true;
create index if not exists idx_users_parent_email on public.users(parent_email)     where parent_email is not null;

-- 3. Scans — add session_id index (missing) and a helper view for dwell per user+event
create index if not exists idx_scans_user_event_channel
  on public.scans(user_id, event_id, channel);

-- 4. View: entry→exit dwell per student per event (used by exhibitor & admin dashboards)
create or replace view public.v_dwell_by_user_event as
select
  s_entry.user_id,
  s_entry.event_id,
  extract(epoch from (s_exit.created_at - s_entry.created_at)) / 60 as dwell_minutes,
  s_entry.created_at  as entry_at,
  s_exit.created_at   as exit_at
from public.scans s_entry
join public.scans s_exit
  on  s_exit.user_id   = s_entry.user_id
  and s_exit.event_id  = s_entry.event_id
  and s_exit.channel   = 'exit'
where s_entry.channel = 'entry';

-- 5. View: per-event intent distribution (used by exhibitor dashboard aggregate panel)
create or replace view public.v_intent_distribution as
select
  e.id            as event_id,
  e.name          as event_name,
  count(*)        as total_users,
  count(*) filter (where u.intent_level = 'high')   as deciding_count,
  count(*) filter (where u.intent_level = 'medium') as comparing_count,
  count(*) filter (where u.intent_level = 'low')    as exploring_count,
  round(100.0 * count(*) filter (where u.intent_level = 'high')   / nullif(count(*),0), 1) as deciding_pct,
  round(100.0 * count(*) filter (where u.intent_level = 'medium') / nullif(count(*),0), 1) as comparing_pct,
  round(100.0 * count(*) filter (where u.intent_level = 'low')    / nullif(count(*),0), 1) as exploring_pct
from public.scans sc
join public.events e  on e.id = sc.event_id
join public.users  u  on u.id = sc.user_id
where sc.channel = 'entry'
group by e.id, e.name;

-- 6. Groups: add group_name column if not present (used in teacher dashboard)
alter table public.groups
  add column if not exists group_name text not null default 'Mon groupe';

-- 7. Scans: add metadata column (optional JSON for future payload enrichment)
alter table public.scans
  add column if not exists metadata jsonb default '{}';

-- 8. RLS — parent can read their linked student's profile (read-only)
--    Parent is identified by parent_email matching their own email.
--    We allow them to read the student row where parent_email = their email.

create policy "Parent reads linked student profile"
  on public.users for select
  using (
    parent_email = (select email from public.users where id = auth.uid())
    or id = auth.uid()
  );

-- 9. Booth users (is_booth_registered = true) should not appear in exhibitor lead feeds
--    The scans API already handles this via email filter; this view makes it explicit.
create or replace view public.v_app_users as
select * from public.users
where email not like '%@booth.letudiant-salons.fr';

-- 10. Performance: ensure groups lookup by teacher_id is fast
create index if not exists idx_groups_teacher_id on public.groups(teacher_id);
