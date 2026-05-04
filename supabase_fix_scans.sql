-- Fix: Add school_id column to scans table if missing
-- The exhibitor dashboard queries scans.school_id to display analytics.
-- The exhibitor QR contains schoolId, so we store it directly for fast lookups.

-- Add school_id column (nullable, soft-link to schools)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- Index for the dashboard queries (filter by school_id + channel)
CREATE INDEX IF NOT EXISTS scans_school_id_idx ON scans(school_id);
CREATE INDEX IF NOT EXISTS scans_school_channel_idx ON scans(school_id, channel);

-- Backfill: for existing scans that have a stand_id, copy the school_id
-- from the stands table (if any stands exist).
UPDATE scans s
SET school_id = st.school_id
FROM stands st
WHERE s.stand_id = st.id AND s.school_id IS NULL;
