-- ─────────────────────────────────────────────────────────────────────────────
-- 014_event_qr_and_programs.sql
-- Adds:
--  1. Event-level QR codes (entry_qr / exit_qr columns on `events`)
--  2. event_programs table for salon schedules (sessions/talks)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Event-level QR code columns ──────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS entry_qr TEXT,
  ADD COLUMN IF NOT EXISTS exit_qr  TEXT;

-- ── 2. event_programs table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time   TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_programs_event ON event_programs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_programs_start ON event_programs(start_time);

-- ── RLS: admin write, public read (so students can see programmes) ──────────
ALTER TABLE event_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read event programs" ON event_programs;
CREATE POLICY "Public can read event programs" ON event_programs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage event programs" ON event_programs;
CREATE POLICY "Admins can manage event programs" ON event_programs
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
