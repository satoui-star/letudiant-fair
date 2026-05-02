-- Migration 014: Event Programs & QR Codes
-- Adds event-level QR codes and programme management

-- Step 1: Add QR code columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS exit_qr TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;

-- Step 2: Create event_programs table
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

-- Step 3: Create event_exhibitors table (for manual exhibitor management)
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT now(),
  UNIQUE(event_id, school_id)
);

-- Step 4: Set up RLS policies for event_programs
ALTER TABLE event_programs ENABLE ROW LEVEL SECURITY;

-- Public can read programmes
CREATE POLICY "event_programmes_select" ON event_programs FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "event_programmes_insert" ON event_programs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "event_programmes_update" ON event_programs FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "event_programmes_delete" ON event_programs FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Step 5: Set up RLS policies for event_exhibitors
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;

-- Public can read exhibitors
CREATE POLICY "event_exhibitors_select" ON event_exhibitors FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "event_exhibitors_insert" ON event_exhibitors FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "event_exhibitors_delete" ON event_exhibitors FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS event_programs_event_id_idx ON event_programs(event_id);
CREATE INDEX IF NOT EXISTS event_programs_start_time_idx ON event_programs(start_time);
CREATE INDEX IF NOT EXISTS event_exhibitors_event_id_idx ON event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS event_exhibitors_school_id_idx ON event_exhibitors(school_id);
