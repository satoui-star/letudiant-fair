-- ============================================================================
-- 010_school_owner_and_saved.sql
--
-- Purpose:
--   1. Link each row in public.schools to the exhibitor user that owns it
--      (enables per-exhibitor queries in /exhibitor/profile, /exhibitor/leads
--      and /exhibitor/dashboard without leaking other exhibitors' data).
--   2. Add a generic public.saved_items table backing the student "Mon Dossier"
--      page (documents / liens / téléchargements).
-- ============================================================================

-- ─── 1. schools.user_id ──────────────────────────────────────────────────────
alter table public.schools
  add column if not exists user_id uuid references public.users(id) on delete set null;

create index if not exists idx_schools_user_id on public.schools(user_id);

-- RLS: exhibitor owners can read & update their own row; everyone can read.
drop policy if exists "Schools readable by all" on public.schools;
create policy "Schools readable by all"
  on public.schools for select
  using (true);

drop policy if exists "Owners update their school" on public.schools;
create policy "Owners update their school"
  on public.schools for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage schools" on public.schools;
create policy "Admins manage schools"
  on public.schools for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── 2. saved_items ──────────────────────────────────────────────────────────
-- Kinds: 'document' (brochure scanned at stand), 'link' (URL saved from a
-- school page), 'download' (file downloaded from a school fiche).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'saved_item_kind') then
    create type saved_item_kind as enum ('document', 'link', 'download');
  end if;
end $$;

create table if not exists public.saved_items (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  school_id    uuid references public.schools(id) on delete set null,
  kind         saved_item_kind not null,
  label        text not null,
  url          text,
  file_name    text,
  file_size    text,
  meta         jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

create index if not exists idx_saved_items_user on public.saved_items(user_id, created_at desc);
create index if not exists idx_saved_items_user_kind on public.saved_items(user_id, kind);

alter table public.saved_items enable row level security;

drop policy if exists "Users read own saved_items" on public.saved_items;
create policy "Users read own saved_items"
  on public.saved_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own saved_items" on public.saved_items;
create policy "Users insert own saved_items"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own saved_items" on public.saved_items;
create policy "Users delete own saved_items"
  on public.saved_items for delete
  using (auth.uid() = user_id);
