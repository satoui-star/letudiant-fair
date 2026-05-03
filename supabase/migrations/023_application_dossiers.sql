-- ============================================================================
-- 018_application_dossiers.sql
--
-- Purpose:
--   Add application dossiers system for students to manage school applications.
--   Students can create a dossier per school and upload application documents
--   (CV, motivation letter, transcripts, recommendation letters, etc.)
-- ============================================================================

-- ─── Dossier Type Enum ───────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'dossier_status') then
    create type dossier_status as enum ('draft', 'in_progress', 'submitted', 'completed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type document_type as enum ('cv', 'motivation_letter', 'transcript', 'recommendation', 'other');
  end if;
end $$;

-- ─── Application Dossiers ────────────────────────────────────────────────────
create table if not exists public.application_dossiers (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  school_id       uuid references public.schools(id) on delete set null,
  custom_school_name text,
  custom_school_location text,
  status          dossier_status default 'draft' not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  -- Constraint: either school_id or custom_school_name must be set
  constraint dossier_has_school check (school_id is not null or custom_school_name is not null)
);

create index if not exists idx_dossiers_user on public.application_dossiers(user_id, created_at desc);
create index if not exists idx_dossiers_school on public.application_dossiers(school_id);
create unique index if not exists idx_dossiers_user_school on public.application_dossiers(user_id, school_id) where school_id is not null;

alter table public.application_dossiers enable row level security;

drop policy if exists "Users read own dossiers" on public.application_dossiers;
create policy "Users read own dossiers"
  on public.application_dossiers for select
  using (auth.uid() = user_id);

drop policy if exists "Users create own dossiers" on public.application_dossiers;
create policy "Users create own dossiers"
  on public.application_dossiers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own dossiers" on public.application_dossiers;
create policy "Users update own dossiers"
  on public.application_dossiers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own dossiers" on public.application_dossiers;
create policy "Users delete own dossiers"
  on public.application_dossiers for delete
  using (auth.uid() = user_id);

-- ─── Application Documents ───────────────────────────────────────────────────
create table if not exists public.application_documents (
  id              uuid primary key default uuid_generate_v4(),
  dossier_id      uuid not null references public.application_dossiers(id) on delete cascade,
  type            document_type not null,
  file_name       text not null,
  file_path       text not null,  -- Supabase storage path
  file_size       bigint not null,
  uploaded_at     timestamptz default now()
);

create index if not exists idx_documents_dossier on public.application_documents(dossier_id);
create index if not exists idx_documents_type on public.application_documents(dossier_id, type);

alter table public.application_documents enable row level security;

-- RLS: Users can only access documents in their own dossiers
drop policy if exists "Users read own documents" on public.application_documents;
create policy "Users read own documents"
  on public.application_documents for select
  using (
    exists (
      select 1 from public.application_dossiers d
      where d.id = dossier_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "Users upload own documents" on public.application_documents;
create policy "Users upload own documents"
  on public.application_documents for insert
  with check (
    exists (
      select 1 from public.application_dossiers d
      where d.id = dossier_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own documents" on public.application_documents;
create policy "Users delete own documents"
  on public.application_documents for delete
  using (
    exists (
      select 1 from public.application_dossiers d
      where d.id = dossier_id and d.user_id = auth.uid()
    )
  );

-- ─── Storage bucket for application documents ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('application-docs', 'application-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users manage own application docs" on storage.objects;
create policy "Users manage own application docs"
  on storage.objects for all
  using (
    bucket_id = 'application-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'application-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
