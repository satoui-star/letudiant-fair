-- Migration Fix: Only add what's missing
-- Run this instead of the previous migration

-- Step 1: Add missing columns to events table (if they don't exist)
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS exit_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;

-- Step 2: Create event_programs table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  location TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Step 3: Create event_exhibitors table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT now(),
  UNIQUE(event_id, school_id)
);

-- Step 4: Enable RLS (safe to run multiple times)
ALTER TABLE event_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "event_programmes_select" ON event_programs;
DROP POLICY IF EXISTS "event_programmes_insert" ON event_programs;
DROP POLICY IF EXISTS "event_programmes_update" ON event_programs;
DROP POLICY IF EXISTS "event_programmes_delete" ON event_programs;

DROP POLICY IF EXISTS "event_exhibitors_select" ON event_exhibitors;
DROP POLICY IF EXISTS "event_exhibitors_insert" ON event_exhibitors;
DROP POLICY IF EXISTS "event_exhibitors_delete" ON event_exhibitors;

-- Step 6: Create event_programs policies
CREATE POLICY "event_programmes_select" ON event_programs FOR SELECT USING (true);
CREATE POLICY "event_programmes_insert" ON event_programs FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_programmes_update" ON event_programs FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_programmes_delete" ON event_programs FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Step 7: Create event_exhibitors policies
CREATE POLICY "event_exhibitors_select" ON event_exhibitors FOR SELECT USING (true);
CREATE POLICY "event_exhibitors_insert" ON event_exhibitors FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "event_exhibitors_delete" ON event_exhibitors FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Step 8: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS event_programs_event_id_idx ON event_programs(event_id);
CREATE INDEX IF NOT EXISTS event_programs_start_time_idx ON event_programs(start_time);
CREATE INDEX IF NOT EXISTS event_exhibitors_event_id_idx ON event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS event_exhibitors_school_id_idx ON event_exhibitors(school_id);
