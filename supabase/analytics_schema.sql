-- ═══════════════════════════════════════════════════════════════════════════
-- L'ÉTUDIANT SALONS — Analytics Extension Schema
-- Run AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Analytics event stream (append-only)
create table if not exists public.analytics_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  session_id  text not null,
  event_type  text not null,
  properties  jsonb default '{}',
  url_path    text,
  device_type text check (device_type in ('mobile','tablet','desktop')),
  created_at  timestamptz default now()
);

create index if not exists idx_analytics_user on public.analytics_events(user_id);
create index if not exists idx_analytics_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);

-- School interaction funnel
create table if not exists public.school_interactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade,
  school_id   uuid references public.schools(id) on delete cascade,
  action      text not null check (action in ('view','bookmark','compare','appointment','swipe_right','swipe_left','formation_view')),
  source      text check (source in ('discover','search','recommendation','qr_scan','comparison')),
  created_at  timestamptz default now()
);

create index if not exists idx_school_interactions_school on public.school_interactions(school_id);
create index if not exists idx_school_interactions_user on public.school_interactions(user_id);

-- Search queries (for recommendation engine)
create table if not exists public.search_queries (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.users(id) on delete set null,
  query_text   text,
  filters      jsonb default '{}',
  result_count integer,
  clicked_id   uuid,
  created_at   timestamptz default now()
);

-- Fair aggregates (materialized every 5 min via Edge Function)
create table if not exists public.fair_aggregates (
  event_id              uuid references public.events(id) on delete cascade,
  computed_at           timestamptz not null,
  total_visitors        integer default 0,
  no_show_count         integer default 0,
  avg_dwell_minutes     numeric(6,2) default 0,
  top_filieres          jsonb default '[]',
  stand_heatmap         jsonb default '[]',
  conversion_rate       numeric(5,2) default 0,
  deciding_lead_count   integer default 0,
  teacher_group_count   integer default 0,
  primary key (event_id, computed_at)
);

-- RLS for analytics (users see only own events, admins see all)
alter table public.analytics_events enable row level security;
alter table public.school_interactions enable row level security;
alter table public.search_queries enable row level security;
alter table public.fair_aggregates enable row level security;

create policy "Users insert own analytics" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "Fair aggregates are public" on public.fair_aggregates for select using (true);
create policy "Users insert own interactions" on public.school_interactions for insert with check (auth.uid() = user_id);
create policy "Users see own interactions" on public.school_interactions for select using (auth.uid() = user_id);

-- Additional performance indexes on existing tables
create index if not exists idx_scans_user_event on public.scans(user_id, event_id);
create index if not exists idx_leads_school_score on public.leads(school_id, score_value desc);
create index if not exists idx_matches_student on public.matches(student_id);
create index if not exists idx_users_role on public.users(role);
