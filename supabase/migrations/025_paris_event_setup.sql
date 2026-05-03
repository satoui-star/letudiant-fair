-- ─────────────────────────────────────────────────────────────────────────────
-- 025_paris_event_setup.sql
-- Phase 1: Complete the "Salon de l'Étudiant Paris" event record.
--
-- Sets:
--   • is_active  = true   (surfaces it as the next upcoming event)
--   • is_virtual = false  (physical event at Palais des Congrès)
--   • entry_qr   = JSON payload encoded in public/qr/paris_entry_QR.png
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.events
SET
  is_active  = true,
  is_virtual = false,
  entry_qr   = '{"type":"entry","eventId":"a1b2c3d4-0000-0000-0000-000000000001"}',
  updated_at = now()
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';
