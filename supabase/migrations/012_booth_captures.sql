-- ============================================================================
-- 011_booth_captures.sql
--
-- Purpose:
--   Create table for non-app-user orientation data captured at fair booths.
--   Enables phygital feature: staff capture student orientation stage without
--   requiring app installation. Data is separate from authenticated users until
--   email-based merge occurs (student signs up with captured email).
--
-- Schema:
--   - booth_captures: stores staff-entered orientation signals (exploring/comparing/deciding)
--   - education_level & education_branches: student's academic interests
--   - contact info: email/phone for follow-up (with opt-in flag)
--   - synced_to_user_id: reference to user after email merge
-- ============================================================================

-- ─── 1. booth_captures table ────────────────────────────────────────────────

create table if not exists public.booth_captures (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  stand_id uuid not null references public.stands(id) on delete cascade,
  email text,
  phone text,
  orientation_stage orientation_stage not null default 'exploring',
  education_level text[] default '{}',
  education_branches text[] default '{}',
  captured_by_staff text, -- staff name or ID (optional, for audit)
  optin_contact boolean default false,
  synced_to_user_id uuid references public.users(id) on delete set null,
  captured_at timestamptz default now(),
  synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for fast lookups
create index if not exists idx_booth_captures_event on public.booth_captures(event_id);
create index if not exists idx_booth_captures_stand on public.booth_captures(stand_id);
create index if not exists idx_booth_captures_email on public.booth_captures(email);
create index if not exists idx_booth_captures_synced_user on public.booth_captures(synced_to_user_id);
create index if not exists idx_booth_captures_stage on public.booth_captures(orientation_stage);

-- ─── 2. Row Level Security ─────────────────────────────────────────────────

alter table public.booth_captures enable row level security;

-- Exhibitors can READ booth_captures for their own stand(s)
drop policy if exists "Exhibitors read own stand captures" on public.booth_captures;
create policy "Exhibitors read own stand captures"
  on public.booth_captures for select
  using (
    exists (
      select 1 from public.stands s
      join public.schools sc on s.school_id = sc.id
      where s.id = booth_captures.stand_id
        and sc.user_id = auth.uid()
    )
  );

-- Teachers can READ aggregated booth_captures for their event
-- (through their students' group membership)
drop policy if exists "Teachers read event captures" on public.booth_captures;
create policy "Teachers read event captures"
  on public.booth_captures for select
  using (
    exists (
      select 1 from public.groups g
      where g.fair_id = booth_captures.event_id
        and g.teacher_id = auth.uid()
    )
  );

-- Admins can READ/MANAGE all booth_captures
drop policy if exists "Admins manage booth captures" on public.booth_captures;
create policy "Admins manage booth captures"
  on public.booth_captures for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── 3. API INSERT policy (unauthenticated endpoint) ────────────────────────
-- When staff calls POST /api/booth/capture-orientation, Supabase service role
-- (not user auth) inserts rows. Allow this via "Booth staff API" policy.

drop policy if exists "Booth staff API inserts" on public.booth_captures;
create policy "Booth staff API inserts"
  on public.booth_captures for insert
  with check (true); -- service_role always has access; RLS only gates SELECT

-- ─── 4. Function: Merge booth capture into user profile ────────────────────
-- When a user signs up with email that matches a booth_captures row:
--   - Copy orientation_stage, education_level, education_branches to users
--   - Link booth_captures.synced_to_user_id = new user id
--
-- Called after user creation in auth trigger or signup endpoint.

drop function if exists public.merge_booth_capture_to_user(uuid, text);
create or replace function public.merge_booth_capture_to_user(
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
as $$
declare
  v_capture public.booth_captures%rowtype;
begin
  -- Find the most recent (not already synced) booth capture for this email
  select * into v_capture
    from public.booth_captures
    where email = p_email
      and synced_to_user_id is null
    order by captured_at desc
    limit 1;

  if found then
    -- Update user profile with booth data
    update public.users
      set
        orientation_stage = coalesce(v_capture.orientation_stage, orientation_stage),
        education_level = coalesce(
          v_capture.education_level[1],
          education_level
        ),
        education_branches = array_cat(
          coalesce(v_capture.education_branches, '{}'),
          coalesce(education_branches, '{}')
        ),
        updated_at = now()
      where id = p_user_id;

    -- Mark capture as synced
    update public.booth_captures
      set
        synced_to_user_id = p_user_id,
        synced_at = now()
      where id = v_capture.id;

    return true;
  end if;

  return false;
end $$;

-- ─── 5. Trigger: Auto-merge on user creation ────────────────────────────────
-- When a new user is inserted, try to merge booth captures.

drop trigger if exists trigger_merge_booth_on_user_create on public.users;
create trigger trigger_merge_booth_on_user_create
  after insert on public.users
  for each row
  execute procedure merge_booth_capture_to_user(new.id, new.email);

