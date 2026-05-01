-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: event_exhibitors
-- Links schools (exhibitors) to events (salons) for registration
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, school_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_exhibitors_event ON event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_exhibitors_school ON event_exhibitors(school_id);

-- Table: event_students
-- Tracks student registrations for events with QR code entry/exit
CREATE TABLE IF NOT EXISTS event_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_entry BOOLEAN DEFAULT FALSE,
  scanned_exit BOOLEAN DEFAULT FALSE,
  entry_qr TEXT,
  exit_qr TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_students_event ON event_students(event_id);
CREATE INDEX IF NOT EXISTS idx_event_students_user ON event_students(user_id);
CREATE INDEX IF NOT EXISTS idx_event_students_scans ON event_students(scanned_entry, scanned_exit);

-- Table: event_scans (optional, for detailed audit trail)
-- Records each scan with timestamp for analytics
CREATE TABLE IF NOT EXISTS event_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('entry', 'exit')),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_event_scans_event ON event_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_event_scans_user ON event_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_event_scans_type ON event_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_event_scans_time ON event_scans(scanned_at);

-- Add updated_at column to events if not present
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- RLS Policies (if using RLS)
-- Allow admins to manage event_exhibitors
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage event exhibitors" ON event_exhibitors;
CREATE POLICY "Admins can manage event exhibitors" ON event_exhibitors
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow students and exhibitors to view their event registrations
ALTER TABLE event_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own registrations" ON event_students;
CREATE POLICY "Students can view their own registrations" ON event_students
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public to scan QR codes (for app integration)
DROP POLICY IF EXISTS "Public can scan QR codes" ON event_students;
CREATE POLICY "Public can scan QR codes" ON event_students
  FOR UPDATE USING (true)
  WITH CHECK (true);
