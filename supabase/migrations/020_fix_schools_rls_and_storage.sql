-- ============================================================================
-- 015_fix_schools_rls_and_storage.sql
--
-- Purpose:
--   1. Add INSERT policy so exhibitors can create their own school row
--   2. Create storage buckets for school cover images and reel videos
-- ============================================================================

-- ─── 1. Allow exhibitors to INSERT their own school row ─────────────────────
-- The original 010 migration only had SELECT, UPDATE, and admin-ALL policies.
-- Without an INSERT policy, authenticated exhibitors got RLS violation on first save.

drop policy if exists "Owners insert their school" on public.schools;
create policy "Owners insert their school"
  on public.schools for insert
  with check (auth.uid() = user_id);

-- ─── 2. Storage buckets ─────────────────────────────────────────────────────

-- school-covers: public bucket for cover images (JPEG/PNG, max 5MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-covers',
  'school-covers',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- school-reels: public bucket for presentation videos (MP4/MOV, max 100MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-reels',
  'school-reels',
  true,
  104857600,  -- 100 MB
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- ─── 3. Storage RLS policies ────────────────────────────────────────────────

-- school-covers: authenticated users can upload under their own user_id prefix
drop policy if exists "Exhibitors upload cover images" on storage.objects;
create policy "Exhibitors upload cover images"
  on storage.objects for insert
  with check (
    bucket_id = 'school-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Exhibitors update cover images" on storage.objects;
create policy "Exhibitors update cover images"
  on storage.objects for update
  using (
    bucket_id = 'school-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone read cover images" on storage.objects;
create policy "Anyone read cover images"
  on storage.objects for select
  using (bucket_id = 'school-covers');

-- school-reels: same pattern
drop policy if exists "Exhibitors upload reels" on storage.objects;
create policy "Exhibitors upload reels"
  on storage.objects for insert
  with check (
    bucket_id = 'school-reels'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Exhibitors update reels" on storage.objects;
create policy "Exhibitors update reels"
  on storage.objects for update
  using (
    bucket_id = 'school-reels'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone read reels" on storage.objects;
create policy "Anyone read reels"
  on storage.objects for select
  using (bucket_id = 'school-reels');
