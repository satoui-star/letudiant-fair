-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 009 : Student Journey + Behavioral Segments
-- ─────────────────────────────────────────────────────────────────────────
-- Crée les vues pour le dashboard "Parcours étudiants" :
--   - v_student_summary      : KPIs par étudiant × événement
--   - v_student_journey      : timeline chronologique
--   - v_behavioral_segments  : groupes par patterns de visite
--
-- Schéma réel :
--   scans(user_id, event_id, stand_id, session_id, channel, created_at,
--         dwell_estimate, metadata)
--   stands(id, event_id, school_id, location_x, location_y, category)
--   schools(id, name, target_fields, target_levels, ...)
--   appointments(student_id, school_id, event_id, slot_time, status, slot_duration)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- v_student_summary : une ligne par (user × event) avec toutes ses métriques
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_student_summary CASCADE;

CREATE VIEW public.v_student_summary AS
WITH entry_data AS (
  SELECT
    s.user_id,
    s.event_id,
    MIN(s.created_at) AS entered_at,
    MAX(s.created_at) AS last_seen_at
  FROM public.scans s
  WHERE s.channel = 'entry'
  GROUP BY s.user_id, s.event_id
),
stand_data AS (
  SELECT
    s.user_id,
    s.event_id,
    COUNT(DISTINCT s.stand_id) AS unique_stands,
    COUNT(*) AS total_stand_scans,
    MIN(s.created_at) AS first_stand_at,
    MAX(s.created_at) AS last_stand_at,
    AVG(s.dwell_estimate)::int AS avg_dwell_per_stand
  FROM public.scans s
  WHERE s.channel = 'stand'
  GROUP BY s.user_id, s.event_id
),
conf_data AS (
  SELECT
    s.user_id,
    s.event_id,
    COUNT(*) AS conference_count
  FROM public.scans s
  WHERE s.channel = 'conference'
  GROUP BY s.user_id, s.event_id
),
appt_data AS (
  SELECT
    a.student_id AS user_id,
    a.event_id,
    COUNT(*) AS appointment_count,
    COUNT(*) FILTER (WHERE a.status = 'confirmed') AS appointments_confirmed
  FROM public.appointments a
  GROUP BY a.student_id, a.event_id
)
SELECT
  u.id AS user_id,
  u.name AS student_name,
  u.email,
  u.education_level,
  u.bac_series,
  u.education_branches,
  e.id AS event_id,
  e.name AS event_name,
  ed.entered_at,
  ed.last_seen_at,
  EXTRACT(EPOCH FROM (COALESCE(ed.last_seen_at, sd.last_stand_at) - ed.entered_at))::int / 60 AS dwell_minutes,
  COALESCE(sd.unique_stands, 0) AS unique_stands_visited,
  COALESCE(sd.total_stand_scans, 0) AS total_stand_scans,
  COALESCE(cd.conference_count, 0) AS conferences_attended,
  COALESCE(ad.appointment_count, 0) AS appointments_total,
  COALESCE(ad.appointments_confirmed, 0) AS appointments_confirmed,
  -- Score d'engagement (0-100)
  LEAST(100, (
    COALESCE(sd.unique_stands, 0) * 8
    + COALESCE(cd.conference_count, 0) * 12
    + COALESCE(ad.appointment_count, 0) * 20
    + CASE WHEN ed.entered_at IS NOT NULL THEN 10 ELSE 0 END
  ))::int AS engagement_score,
  -- Profil comportemental
  CASE
    WHEN COALESCE(ad.appointment_count, 0) >= 1 AND COALESCE(sd.unique_stands, 0) <= 4
      THEN 'Décideur'
    WHEN COALESCE(sd.unique_stands, 0) >= 5
      THEN 'Explorateur'
    WHEN COALESCE(sd.unique_stands, 0) BETWEEN 2 AND 4
      THEN 'Comparateur'
    WHEN ed.entered_at IS NOT NULL
      THEN 'Observateur'
    ELSE 'Inscrit'
  END AS behavioral_profile
FROM public.users u
LEFT JOIN entry_data ed ON ed.user_id = u.id
LEFT JOIN stand_data sd ON sd.user_id = u.id AND sd.event_id = ed.event_id
LEFT JOIN conf_data cd ON cd.user_id = u.id AND cd.event_id = ed.event_id
LEFT JOIN appt_data ad ON ad.user_id = u.id AND ad.event_id = ed.event_id
LEFT JOIN public.events e ON e.id = ed.event_id
WHERE u.role = 'student';


-- ─────────────────────────────────────────────────────────────────────────
-- v_student_journey : timeline détaillée des événements d'un étudiant
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_student_journey CASCADE;

CREATE VIEW public.v_student_journey AS
-- Entrées au salon
SELECT
  s.user_id,
  s.event_id,
  s.created_at AS occurred_at,
  'entry'::text AS event_type,
  'Entrée au salon'::text AS event_label,
  NULL::uuid AS ref_id,
  NULL::text AS ref_name,
  s.metadata
FROM public.scans s
WHERE s.channel = 'entry'

UNION ALL

-- Scans de stand (on remonte à l'école via stands → schools)
SELECT
  s.user_id,
  s.event_id,
  s.created_at AS occurred_at,
  'stand'::text AS event_type,
  'Visite stand'::text AS event_label,
  sch.id AS ref_id,
  sch.name AS ref_name,
  jsonb_build_object(
    'stand_id', s.stand_id,
    'school_fields', sch.target_fields,
    'school_city', sch.city,
    'dwell_estimate', s.dwell_estimate
  ) AS metadata
FROM public.scans s
LEFT JOIN public.stands st ON st.id = s.stand_id
LEFT JOIN public.schools sch ON sch.id = st.school_id
WHERE s.channel = 'stand'

UNION ALL

-- Conférences
SELECT
  s.user_id,
  s.event_id,
  s.created_at AS occurred_at,
  'conference'::text AS event_type,
  'Conférence'::text AS event_label,
  s.session_id AS ref_id,
  COALESCE(s.metadata->>'conference_name', 'Conférence') AS ref_name,
  s.metadata
FROM public.scans s
WHERE s.channel = 'conference'

UNION ALL

-- Rendez-vous
SELECT
  a.student_id AS user_id,
  a.event_id,
  a.slot_time AS occurred_at,
  'appointment'::text AS event_type,
  'Rendez-vous'::text AS event_label,
  a.school_id AS ref_id,
  sch.name AS ref_name,
  jsonb_build_object(
    'status', a.status,
    'duration_min', a.slot_duration
  ) AS metadata
FROM public.appointments a
LEFT JOIN public.schools sch ON sch.id = a.school_id;


-- ─────────────────────────────────────────────────────────────────────────
-- v_behavioral_segments : groupes d'étudiants par target_fields visités
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_behavioral_segments CASCADE;

CREATE VIEW public.v_behavioral_segments AS
WITH stand_fields_per_user AS (
  SELECT
    s.user_id,
    s.event_id,
    array_agg(DISTINCT field ORDER BY field) AS fields_visited,
    COUNT(DISTINCT s.stand_id) AS stands_visited
  FROM public.scans s
  JOIN public.stands st ON st.id = s.stand_id
  JOIN public.schools sch ON sch.id = st.school_id
  LEFT JOIN LATERAL unnest(sch.target_fields) AS field ON TRUE
  WHERE s.channel = 'stand'
  GROUP BY s.user_id, s.event_id
)
SELECT
  event_id,
  CASE
    WHEN array_length(fields_visited, 1) >= 3
      THEN 'Multi-domaines (' || array_length(fields_visited, 1) || ')'
    WHEN array_length(fields_visited, 1) = 2
      THEN fields_visited[1] || ' ↔ ' || fields_visited[2]
    WHEN array_length(fields_visited, 1) = 1
      THEN 'Focus ' || fields_visited[1]
    ELSE 'Indéterminé'
  END AS segment_label,
  COUNT(*) AS student_count,
  array_agg(user_id) AS user_ids,
  AVG(stands_visited)::numeric(10,1) AS avg_schools_visited
FROM stand_fields_per_user
WHERE array_length(fields_visited, 1) IS NOT NULL
GROUP BY event_id, segment_label
ORDER BY student_count DESC;


-- ─────────────────────────────────────────────────────────────────────────
-- Permissions
-- ─────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.v_student_summary     TO anon, authenticated;
GRANT SELECT ON public.v_student_journey     TO anon, authenticated;
GRANT SELECT ON public.v_behavioral_segments TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- Vérification
-- ─────────────────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM public.v_student_summary WHERE event_id IS NOT NULL) AS active_students,
  (SELECT COUNT(*) FROM public.v_student_journey) AS journey_events,
  (SELECT COUNT(*) FROM public.v_behavioral_segments) AS segments;