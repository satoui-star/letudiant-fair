-- ============================================================================
-- 013_score_booth.sql
--
-- Purpose:
--   Adapt booth_captures for the central "Score Booth" run by L'Étudiant team.
--   The Score Booth is ONE booth per fair (not per school) where students get
--   personalized top-3 school recommendations after answering profile questions.
--
-- Key changes:
--   - stand_id becomes NULLABLE (Score Booth has no school stand)
--   - source distinguishes 'score_booth' vs legacy 'school_booth'
--   - captured_by_user_id audits which L'Étudiant operator handled the capture
--   - recommended_school_ids stores the top-3 result for later linking to user
--   - Updated RLS policies for the new flow
-- ============================================================================

-- ─── 1. Make stand_id nullable + add new columns ────────────────────────────

alter table public.booth_captures
  alter column stand_id drop not null;

alter table public.booth_captures
  add column if not exists source text not null default 'school_booth';

alter table public.booth_captures
  add column if not exists captured_by_user_id uuid references public.users(id) on delete set null;

alter table public.booth_captures
  add column if not exists recommended_school_ids uuid[] default '{}';

-- Constrain source values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booth_captures_source_check'
  ) then
    alter table public.booth_captures
      add constraint booth_captures_source_check
        check (source in ('score_booth', 'school_booth'));
  end if;
end $$;

-- Constrain: school_booth requires stand_id; score_booth must NOT have stand_id
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booth_captures_source_stand_check'
  ) then
    alter table public.booth_captures
      add constraint booth_captures_source_stand_check
        check (
          (source = 'school_booth' and stand_id is not null)
          or
          (source = 'score_booth'  and stand_id is null)
        );
  end if;
end $$;

-- ─── 2. Indexes for new columns ─────────────────────────────────────────────

create index if not exists idx_booth_captures_source on public.booth_captures(source);
create index if not exists idx_booth_captures_captured_by on public.booth_captures(captured_by_user_id);

-- ─── 3. Updated RLS policies ────────────────────────────────────────────────

-- Admins (L'Étudiant team) keep full access — already exists from 011, but
-- the existing policy already covers all rows so no change needed.

-- Exhibitors must NOT see score_booth rows (their previous policy filtered by
-- stand_id, which is null for score_booth → already correctly excluded).
-- Refresh the policy explicitly for clarity.
drop policy if exists "Exhibitors read own stand captures" on public.booth_captures;
create policy "Exhibitors read own stand captures"
  on public.booth_captures for select
  using (
    source = 'school_booth'
    and stand_id is not null
    and exists (
      select 1 from public.stands s
      join public.schools sc on s.school_id = sc.id
      where s.id = booth_captures.stand_id
        and sc.user_id = auth.uid()
    )
  );

-- Teachers can still read aggregated booth data for their event (any source)
-- The existing policy from 011 is sufficient.

-- ─── 4. Helper view: score_booth_captures (admin convenience) ───────────────

create or replace view public.score_booth_captures as
  select
    bc.id,
    bc.event_id,
    e.name as event_name,
    bc.captured_at,
    bc.captured_by_user_id,
    u.name as captured_by_name,
    bc.orientation_stage,
    bc.education_level,
    bc.education_branches,
    bc.email,
    bc.phone,
    bc.optin_contact,
    bc.recommended_school_ids,
    bc.synced_to_user_id,
    bc.synced_at
  from public.booth_captures bc
  left join public.events e on e.id = bc.event_id
  left join public.users  u on u.id = bc.captured_by_user_id
  where bc.source = 'score_booth';

-- ─── 5. Function: link score-booth recommendations after capture ────────────
-- Called by /api/booth/recommendations to persist top-3 result onto the row.

drop function if exists public.set_booth_recommendations(uuid, uuid[]);
create or replace function public.set_booth_recommendations(
  p_capture_id uuid,
  p_school_ids uuid[]
)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.booth_captures
    set
      recommended_school_ids = coalesce(p_school_ids, '{}'),
      updated_at             = now()
    where id = p_capture_id;
  return found;
end $$;

-- ─── 6. Backfill: tag existing rows as 'school_booth' ───────────────────────
-- The default already does this, but be explicit for any pre-existing rows.

update public.booth_captures
  set source = 'school_booth'
  where source is null;
