-- ============================================================================
-- 014_exhibitor_media.sql
--
-- Purpose:
--   Add media fields to schools table for exhibitor profile:
--   - cover_image_url: public URL to school's cover image
--   - reel_url: public URL to school's presentation video
-- ============================================================================

alter table public.schools
  add column if not exists cover_image_url text,
  add column if not exists reel_url text;

create index if not exists idx_schools_cover_image_url on public.schools(cover_image_url);
create index if not exists idx_schools_reel_url on public.schools(reel_url);
