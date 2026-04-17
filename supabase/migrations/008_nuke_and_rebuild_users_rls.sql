-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 008 — Nuke and rebuild ALL RLS policies on public.users
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Drop every existing policy on public.users (clean slate)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Rebuild clean, non-recursive policies

-- Any user can read their own row (needed for login role-check)
CREATE POLICY "Users read own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- Any user can update their own row
CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- User can insert their own row (registration)
CREATE POLICY "Users insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Parent can read a linked student's profile (uses JWT, no recursion)
CREATE POLICY "Parent reads linked student profile"
  ON public.users FOR SELECT
  USING (parent_email = (auth.jwt()->>'email'));

-- Admin can read ALL users (uses JWT user_metadata, no table access)
CREATE POLICY "Admin reads all users"
  ON public.users FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- Admin can update ALL users
CREATE POLICY "Admin updates all users"
  ON public.users FOR UPDATE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');
