-- ─────────────────────────────────────────────────────────────────────────────
-- 026_stands_map_position.sql
-- Phase 2: Add position data to the stands table so the SVG map can render
-- real exhibitor booths from the database.
--
-- Adds:
--   • location_x / location_y  — coarse grid coords (already used by seed.sql,
--                                formalised here with IF NOT EXISTS)
--   • map_position JSONB        — precise SVG rect coords: {x, y, w, h}
--                                 populated per-event once the floor plan is set
--   • stand_label TEXT          — physical stand identifier printed on maps
--                                 (e.g. "A-12", "B-07")
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.stands
  ADD COLUMN IF NOT EXISTS location_x   INTEGER,
  ADD COLUMN IF NOT EXISTS location_y   INTEGER,
  ADD COLUMN IF NOT EXISTS map_position JSONB,
  ADD COLUMN IF NOT EXISTS stand_label  TEXT;

-- Index so we can quickly fetch all positioned stands for a given event
-- (used by the SVG map query: stands WHERE event_id = X AND map_position IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_stands_event_map
  ON public.stands(event_id)
  WHERE map_position IS NOT NULL;

COMMENT ON COLUMN public.stands.map_position IS
  'SVG viewport coordinates for the interactive floor-plan map. '
  'Shape: {"x": int, "y": int, "w": int, "h": int}. '
  'Null until the admin configures stand positions for this event.';

COMMENT ON COLUMN public.stands.stand_label IS
  'Physical stand number printed on venue maps and badge lanyards (e.g. "A-12").';
