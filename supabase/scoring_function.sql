-- ═══════════════════════════════════════════════════════════════════════════
-- L'ÉTUDIANT SALONS — Scoring Function
-- ─────────────────────────────────────────────────────────────────────────
-- Run AFTER: schema.sql + migrations + seed.sql + seed_demo.sql
--
-- This file creates the compute_lead_scores() function and runs it.
-- Re-run anytime to refresh all lead scores (e.g. after new interactions).
--
-- Scoring weights:
--   Registration completed       =  5 pts (flat)
--   Showed up (entry scan)       = 20 pts (flat)
--   Per stand visited            =  3 pts (each)
--   Dwell time > 2 hours         = 10 pts (flat bonus)
--   Per swipe right              =  2 pts (each)
--   Per appointment booked       = 15 pts (each)
--   Per conference attended       =  5 pts (each)
--
-- Tiers:
--   deciding  = score >= 40  (hot lead)
--   comparing = score 20-39  (warm lead)
--   exploring = score < 20   (cold / no-show)
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate to ensure latest version
DROP FUNCTION IF EXISTS compute_lead_scores();

CREATE OR REPLACE FUNCTION compute_lead_scores() RETURNS void AS $fn$
BEGIN
INSERT INTO public.leads (student_id, school_id, event_id, education_level, education_branches, score_value, score_tier, score_computed_at, swipe_result, appointment_booked)
SELECT u.id, st.school_id, st.event_id, COALESCE(u.education_level, 'unknown'), u.education_branches,
(5 + 20*(COUNT(DISTINCT sc_entry.id)>0)::int + 3*COUNT(DISTINCT sc_stand.id) + 10*CASE WHEN MAX(dw.dwell_minutes)>=120 THEN 1 ELSE 0 END + 2*COUNT(DISTINCT m_right.id) + 15*COUNT(DISTINCT a.id) + 5*COUNT(DISTINCT sc_conf.id))::integer,
CASE WHEN (5+20*(COUNT(DISTINCT sc_entry.id)>0)::int+3*COUNT(DISTINCT sc_stand.id)+10*CASE WHEN MAX(dw.dwell_minutes)>=120 THEN 1 ELSE 0 END+2*COUNT(DISTINCT m_right.id)+15*COUNT(DISTINCT a.id)+5*COUNT(DISTINCT sc_conf.id))>=40 THEN 'deciding'::orientation_stage WHEN (5+20*(COUNT(DISTINCT sc_entry.id)>0)::int+3*COUNT(DISTINCT sc_stand.id)+10*CASE WHEN MAX(dw.dwell_minutes)>=120 THEN 1 ELSE 0 END+2*COUNT(DISTINCT m_right.id)+15*COUNT(DISTINCT a.id)+5*COUNT(DISTINCT sc_conf.id))>=20 THEN 'comparing'::orientation_stage ELSE 'exploring'::orientation_stage END,
now(), (COUNT(DISTINCT m_right.id)>0), (COUNT(DISTINCT a.id)>0)
FROM public.users u
CROSS JOIN (SELECT DISTINCT school_id, event_id FROM public.stands) st
LEFT JOIN public.scans sc_entry ON sc_entry.user_id=u.id AND sc_entry.event_id=st.event_id AND sc_entry.channel='entry'
LEFT JOIN public.scans sc_stand ON sc_stand.user_id=u.id AND sc_stand.event_id=st.event_id AND sc_stand.channel='stand'
LEFT JOIN public.scans sc_conf ON sc_conf.user_id=u.id AND sc_conf.event_id=st.event_id AND sc_conf.channel='conference'
LEFT JOIN public.v_dwell_by_user_event dw ON dw.user_id=u.id AND dw.event_id=st.event_id
LEFT JOIN public.matches m_right ON m_right.student_id=u.id AND m_right.school_id=st.school_id AND m_right.student_swipe='right'
LEFT JOIN public.appointments a ON a.student_id=u.id AND a.school_id=st.school_id AND a.status!='cancelled'
WHERE u.role='student'
GROUP BY u.id, st.school_id, st.event_id, u.education_level, u.education_branches
ON CONFLICT (student_id, school_id, event_id) DO UPDATE SET score_value=EXCLUDED.score_value, score_tier=EXCLUDED.score_tier, score_computed_at=now(), swipe_result=EXCLUDED.swipe_result, appointment_booked=EXCLUDED.appointment_booked;
END;
$fn$ LANGUAGE plpgsql;

-- Run the scoring now
SELECT compute_lead_scores();

-- Show results
SELECT
  score_tier,
  count(*) as leads,
  round(avg(score_value),1) as avg_score,
  min(score_value) as min_score,
  max(score_value) as max_score
FROM leads
GROUP BY score_tier
ORDER BY avg_score DESC;