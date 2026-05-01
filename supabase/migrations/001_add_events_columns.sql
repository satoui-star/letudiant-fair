-- Add missing columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Create indexes if not present
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
