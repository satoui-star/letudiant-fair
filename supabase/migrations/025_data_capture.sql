-- ============================================================================
-- 020_data_capture.sql
--
-- Purpose:
--   Post-fair data capture infrastructure:
--   1. Enrich application_dossiers with interest alignment score + field snapshot
--   2. Create dossier_stage_events to log every stage transition with timestamps
--      → enables time-in-stage analytics and funnel analysis
-- ============================================================================

-- ─── Enrich application_dossiers ─────────────────────────────────────────────

alter table public.application_dossiers
  add column if not exists interest_alignment_score numeric(3,2) default null,
  add column if not exists student_fields_at_creation text[] default '{}',
  add column if not exists application_outcome text default null, -- 'accepted' | 'rejected' | 'waitlisted' | 'withdrawn'
  add column if not exists outcome_received_at timestamptz default null;

comment on column public.application_dossiers.interest_alignment_score
  is 'Jaccard similarity between student education_branches and school target_fields at dossier creation time. Range 0.0–1.0.';

comment on column public.application_dossiers.student_fields_at_creation
  is 'Snapshot of student education_branches at the moment the dossier was created. Immutable reference for analysis.';

comment on column public.application_dossiers.application_outcome
  is 'Final decision received from the school after submission.';

-- ─── Stage Transition Events ─────────────────────────────────────────────────

create table if not exists public.dossier_stage_events (
  id           uuid primary key default uuid_generate_v4(),
  dossier_id   uuid not null references public.application_dossiers(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  from_status  dossier_status,           -- null for the initial 'draft' creation event
  to_status    dossier_status not null,
  occurred_at  timestamptz default now()
);

create index if not exists idx_stage_events_dossier
  on public.dossier_stage_events(dossier_id, occurred_at);

create index if not exists idx_stage_events_user
  on public.dossier_stage_events(user_id, occurred_at);

create index if not exists idx_stage_events_to_status
  on public.dossier_stage_events(to_status, occurred_at);

alter table public.dossier_stage_events enable row level security;

drop policy if exists "Users insert own stage events" on public.dossier_stage_events;
create policy "Users insert own stage events"
  on public.dossier_stage_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own stage events" on public.dossier_stage_events;
create policy "Users read own stage events"
  on public.dossier_stage_events for select
  using (auth.uid() = user_id);
