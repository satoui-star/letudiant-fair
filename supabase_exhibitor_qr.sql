-- Adds QR storage to event_exhibitors so each (school, salon) pair has ONE
-- unique, permanent QR code. Generated once, then re-served from DB.

ALTER TABLE event_exhibitors
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS qr_token TEXT,
  ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMP;

-- Index for fast lookup when an exhibitor loads their leads page
CREATE INDEX IF NOT EXISTS event_exhibitors_school_event_idx
  ON event_exhibitors(school_id, event_id);
