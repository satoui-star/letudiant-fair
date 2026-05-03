-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 007 — Fix RLS recursion + Admin read-all policies
-- Run in Supabase SQL Editor after migrations 001–006
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fix the recursive parent policy that causes "Database error querying schema"
--    The old policy did: select email from public.users where id = auth.uid()
--    which triggers RLS on the same table → infinite recursion.
--    Fix: use auth.jwt()->>'email' which reads from the JWT, no table access.

DROP POLICY IF EXISTS "Parent reads linked student profile" ON public.users;

CREATE POLICY "Parent reads linked student profile"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR parent_email = (auth.jwt()->>'email')
  );

-- 2. Admin read-all policies
--    The admin dashboard needs to read ALL rows across all tables.
--    We use auth.jwt()->'user_metadata'->>'role' to avoid recursion.

CREATE POLICY "Admin reads all users"
  ON public.users FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all scans"
  ON public.scans FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all leads"
  ON public.leads FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all matches"
  ON public.matches FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all appointments"
  ON public.appointments FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all groups"
  ON public.groups FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

CREATE POLICY "Admin reads all pre_registrations"
  ON public.pre_registrations FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'role' = 'admin');
