-- ─────────────────────────────────────────────────────────────────────────────
-- 028_paris_stands_positions.sql
-- Phase 3: Assign SVG map_position to every Paris exhibitor stand.
--
-- ViewBox: 0 0 380 490  (portrait, mobile-first)
-- 7 rows of 5 stands each (last row has 4), separated by labelled aisles.
-- Stand dimensions: w=65, h=42
-- Row y positions: 20, 82, 144, 206, 268, 330, 392
-- Aisle bands (h=20): 62, 124, 186, 248, 310, 372
-- ─────────────────────────────────────────────────────────────────────────────

-- ROW 1  (y=20)  — stands A-01 … A-05
UPDATE public.stands SET map_position = '{"x":12,  "y":20, "w":65,"h":42}', stand_label = 'A-01'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000001';

UPDATE public.stands SET map_position = '{"x":85,  "y":20, "w":65,"h":42}', stand_label = 'A-02'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000002';

UPDATE public.stands SET map_position = '{"x":158, "y":20, "w":65,"h":42}', stand_label = 'A-03'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000003';

UPDATE public.stands SET map_position = '{"x":231, "y":20, "w":65,"h":42}', stand_label = 'A-04'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000004';

UPDATE public.stands SET map_position = '{"x":304, "y":20, "w":65,"h":42}', stand_label = 'A-05'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000005';

-- ROW 2  (y=82)  — stands A-06 … A-10
UPDATE public.stands SET map_position = '{"x":12,  "y":82, "w":65,"h":42}', stand_label = 'A-06'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000006';

UPDATE public.stands SET map_position = '{"x":85,  "y":82, "w":65,"h":42}', stand_label = 'A-07'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000007';

UPDATE public.stands SET map_position = '{"x":158, "y":82, "w":65,"h":42}', stand_label = 'A-08'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000008';

UPDATE public.stands SET map_position = '{"x":231, "y":82, "w":65,"h":42}', stand_label = 'A-09'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000009';

UPDATE public.stands SET map_position = '{"x":304, "y":82, "w":65,"h":42}', stand_label = 'A-10'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000010';

-- ROW 3  (y=144) — stands A-11 … A-15
UPDATE public.stands SET map_position = '{"x":12,  "y":144,"w":65,"h":42}', stand_label = 'A-11'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000011';

UPDATE public.stands SET map_position = '{"x":85,  "y":144,"w":65,"h":42}', stand_label = 'A-12'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000012';

UPDATE public.stands SET map_position = '{"x":158, "y":144,"w":65,"h":42}', stand_label = 'A-13'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000013';

UPDATE public.stands SET map_position = '{"x":231, "y":144,"w":65,"h":42}', stand_label = 'A-14'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000014';

UPDATE public.stands SET map_position = '{"x":304, "y":144,"w":65,"h":42}', stand_label = 'A-15'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000015';

-- ROW 4  (y=206) — stands A-16 … A-20
UPDATE public.stands SET map_position = '{"x":12,  "y":206,"w":65,"h":42}', stand_label = 'A-16'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000016';

UPDATE public.stands SET map_position = '{"x":85,  "y":206,"w":65,"h":42}', stand_label = 'A-17'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000017';

UPDATE public.stands SET map_position = '{"x":158, "y":206,"w":65,"h":42}', stand_label = 'A-18'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000018';

UPDATE public.stands SET map_position = '{"x":231, "y":206,"w":65,"h":42}', stand_label = 'A-19'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000019';

UPDATE public.stands SET map_position = '{"x":304, "y":206,"w":65,"h":42}', stand_label = 'A-20'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000020';

-- ROW 5  (y=268) — stands A-21 … A-25
UPDATE public.stands SET map_position = '{"x":12,  "y":268,"w":65,"h":42}', stand_label = 'A-21'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000021';

UPDATE public.stands SET map_position = '{"x":85,  "y":268,"w":65,"h":42}', stand_label = 'A-22'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000022';

UPDATE public.stands SET map_position = '{"x":158, "y":268,"w":65,"h":42}', stand_label = 'A-23'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000023';

UPDATE public.stands SET map_position = '{"x":231, "y":268,"w":65,"h":42}', stand_label = 'A-24'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000024';

UPDATE public.stands SET map_position = '{"x":304, "y":268,"w":65,"h":42}', stand_label = 'A-25'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000025';

-- ROW 6  (y=330) — stands A-26 … A-30
UPDATE public.stands SET map_position = '{"x":12,  "y":330,"w":65,"h":42}', stand_label = 'A-26'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000026';

UPDATE public.stands SET map_position = '{"x":85,  "y":330,"w":65,"h":42}', stand_label = 'A-27'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000027';

UPDATE public.stands SET map_position = '{"x":158, "y":330,"w":65,"h":42}', stand_label = 'A-28'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000028';

UPDATE public.stands SET map_position = '{"x":231, "y":330,"w":65,"h":42}', stand_label = 'A-29'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000029';

UPDATE public.stands SET map_position = '{"x":304, "y":330,"w":65,"h":42}', stand_label = 'A-30'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000030';

-- ROW 7  (y=392) — stands A-31 … A-34  (4 stands, centred)
UPDATE public.stands SET map_position = '{"x":48,  "y":392,"w":65,"h":42}', stand_label = 'A-31'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000031';

UPDATE public.stands SET map_position = '{"x":121, "y":392,"w":65,"h":42}', stand_label = 'A-32'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000032';

UPDATE public.stands SET map_position = '{"x":194, "y":392,"w":65,"h":42}', stand_label = 'A-33'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000033';

UPDATE public.stands SET map_position = '{"x":267, "y":392,"w":65,"h":42}', stand_label = 'A-34'
  WHERE event_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND school_id = 'e1e2e3e4-0000-0000-0000-000000000034';
