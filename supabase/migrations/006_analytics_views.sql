-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 006 — Analytics Views for BI / Data Viz Tools
-- Connect Metabase, Power BI, or Looker Studio directly to these views.
-- All views are read-only and GDPR-safe (no PII in exhibitor-facing views).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Event KPIs — one row per event with all headline numbers
create or replace view public.v_event_kpis as
select
  e.id as event_id,
  e.name as event_name,
  e.city,
  e.event_date,
  -- Registration
  count(distinct u.id) filter (where u.role = 'student') as total_students,
  count(distinct u.id) filter (where u.is_booth_registered = true) as booth_registered,
  count(distinct u.id) filter (where u.is_booth_registered = false or u.is_booth_registered is null) as app_registered,
  -- Scans
  count(distinct sc.user_id) filter (where sc.channel = 'entry') as entered,
  count(distinct sc.user_id) filter (where sc.channel = 'exit') as exited,
  count(*) filter (where sc.channel = 'stand') as total_stand_scans,
  count(*) filter (where sc.channel = 'conference') as total_conf_scans,
  -- Intent distribution
  count(distinct u.id) filter (where u.intent_level = 'high') as deciding_count,
  count(distinct u.id) filter (where u.intent_level = 'medium') as comparing_count,
  count(distinct u.id) filter (where u.intent_level = 'low') as exploring_count,
  -- Pre-registrations
  count(distinct pr.id) as pre_registrations_total,
  count(distinct pr.id) filter (where pr.resolved_user_id is not null) as pre_registrations_resolved,
  -- Groups
  count(distinct g.id) as teacher_groups,
  coalesce(sum(array_length(g.member_uids, 1)), 0)::int as group_members_total,
  -- Appointments
  count(distinct apt.id) as total_appointments,
  count(distinct apt.id) filter (where apt.status = 'confirmed') as confirmed_appointments
from public.events e
left join public.scans sc on sc.event_id = e.id
left join public.users u on u.id = sc.user_id
left join public.pre_registrations pr on pr.event_id = e.id
left join public.groups g on g.fair_id = e.id
left join public.appointments apt on apt.event_id = e.id
group by e.id, e.name, e.city, e.event_date;

-- 2. Stand performance — scans + dwell per stand per event
create or replace view public.v_stand_performance as
select
  st.id as stand_id,
  st.event_id,
  ev.name as event_name,
  sc_school.name as school_name,
  sc_school.city as school_city,
  sc_school.type as school_type,
  st.category,
  count(*) as scan_count,
  count(distinct sc.user_id) as unique_visitors,
  count(*) filter (where sc.created_at::time < '12:00') as morning_scans,
  count(*) filter (where sc.created_at::time >= '12:00' and sc.created_at::time < '14:00') as lunch_scans,
  count(*) filter (where sc.created_at::time >= '14:00') as afternoon_scans,
  -- Swipe data for this school
  (select count(*) from public.matches m where m.school_id = st.school_id and m.student_swipe = 'right') as swipe_rights,
  (select count(*) from public.matches m where m.school_id = st.school_id and m.student_swipe = 'left') as swipe_lefts,
  -- Appointments
  (select count(*) from public.appointments a where a.school_id = st.school_id and a.event_id = st.event_id) as appointments
from public.stands st
join public.events ev on ev.id = st.event_id
join public.schools sc_school on sc_school.id = st.school_id
left join public.scans sc on sc.stand_id = st.id and sc.channel = 'stand'
group by st.id, st.event_id, ev.name, sc_school.name, sc_school.city, sc_school.type, st.category;

-- 3. Hourly scan heatmap — scans per hour per event (for time-series charts)
create or replace view public.v_hourly_scans as
select
  sc.event_id,
  e.name as event_name,
  date_trunc('hour', sc.created_at) as scan_hour,
  sc.channel,
  count(*) as scan_count,
  count(distinct sc.user_id) as unique_users
from public.scans sc
join public.events e on e.id = sc.event_id
group by sc.event_id, e.name, date_trunc('hour', sc.created_at), sc.channel
order by scan_hour;

-- 4. Student engagement funnel — anonymized, per event
--    (registered → entered → scanned stand → swiped → booked RDV)
create or replace view public.v_engagement_funnel as
select
  e.id as event_id,
  e.name as event_name,
  count(distinct u.id) as registered,
  count(distinct sc_entry.user_id) as entered,
  count(distinct sc_stand.user_id) as scanned_stand,
  count(distinct m.student_id) filter (where m.student_swipe = 'right') as swiped_right,
  count(distinct apt.student_id) as booked_rdv
from public.events e
left join public.scans sc_entry on sc_entry.event_id = e.id and sc_entry.channel = 'entry'
left join public.users u on u.id = sc_entry.user_id and u.role = 'student'
left join public.scans sc_stand on sc_stand.event_id = e.id and sc_stand.channel = 'stand'
left join public.matches m on m.school_id in (select school_id from public.stands where event_id = e.id)
left join public.appointments apt on apt.event_id = e.id
group by e.id, e.name;

-- 5. Education level breakdown — per event, anonymized
create or replace view public.v_education_breakdown as
select
  sc.event_id,
  e.name as event_name,
  u.education_level,
  u.bac_series,
  u.intent_level,
  count(distinct u.id) as student_count
from public.scans sc
join public.events e on e.id = sc.event_id
join public.users u on u.id = sc.user_id and u.role = 'student'
where sc.channel = 'entry'
group by sc.event_id, e.name, u.education_level, u.bac_series, u.intent_level;

-- 6. Field interest heatmap — which education_branches are most popular, per event
create or replace view public.v_field_interest as
select
  sc.event_id,
  e.name as event_name,
  branch,
  count(distinct u.id) as student_count,
  round(100.0 * count(distinct u.id) / nullif((
    select count(distinct s2.user_id) from scans s2 where s2.event_id = sc.event_id and s2.channel = 'entry'
  ), 0), 1) as pct_of_attendees
from public.scans sc
join public.events e on e.id = sc.event_id
join public.users u on u.id = sc.user_id and u.role = 'student'
cross join lateral unnest(u.education_branches) as branch
where sc.channel = 'entry'
group by sc.event_id, e.name, branch;

-- 7. Dwell time distribution — bucketed for histogram charts
create or replace view public.v_dwell_distribution as
select
  d.event_id,
  e.name as event_name,
  case
    when d.dwell_minutes < 30 then '< 30 min'
    when d.dwell_minutes < 60 then '30-60 min'
    when d.dwell_minutes < 120 then '1-2h'
    when d.dwell_minutes < 180 then '2-3h'
    else '3h+'
  end as dwell_bucket,
  count(*) as student_count,
  round(avg(d.dwell_minutes), 1) as avg_dwell
from public.v_dwell_by_user_event d
join public.events e on e.id = d.event_id
group by d.event_id, e.name,
  case
    when d.dwell_minutes < 30 then '< 30 min'
    when d.dwell_minutes < 60 then '30-60 min'
    when d.dwell_minutes < 120 then '1-2h'
    when d.dwell_minutes < 180 then '2-3h'
    else '3h+'
  end;

-- 8. Lead quality by school — anonymized aggregate for exhibitor reports
create or replace view public.v_lead_quality_by_school as
select
  l.school_id,
  s.name as school_name,
  s.type as school_type,
  l.event_id,
  e.name as event_name,
  count(*) as total_leads,
  count(*) filter (where l.score_tier = 'deciding') as deciding_leads,
  count(*) filter (where l.score_tier = 'comparing') as comparing_leads,
  count(*) filter (where l.score_tier = 'exploring') as exploring_leads,
  round(avg(l.score_value), 1) as avg_score,
  round(avg(l.dwell_minutes), 1) as avg_dwell
from public.leads l
join public.schools s on s.id = l.school_id
join public.events e on e.id = l.event_id
group by l.school_id, s.name, s.type, l.event_id, e.name;

-- 9. Group performance — teacher groups with registration and scan rates
create or replace view public.v_group_performance as
select
  g.id as group_id,
  g.school_name,
  g.group_name,
  e.name as event_name,
  e.event_date,
  array_length(g.member_uids, 1) as member_count,
  (
    select count(distinct sc.user_id)
    from public.scans sc
    where sc.event_id = g.fair_id
      and sc.channel = 'entry'
      and sc.user_id = any(g.member_uids)
  ) as members_entered,
  (
    select count(distinct sc.user_id)
    from public.scans sc
    where sc.event_id = g.fair_id
      and sc.channel = 'stand'
      and sc.user_id = any(g.member_uids)
  ) as members_scanned_stand
from public.groups g
join public.events e on e.id = g.fair_id;

-- 10. Pre-registration funnel — conversion from EventMaker to app
create or replace view public.v_prereg_funnel as
select
  pr.event_id,
  e.name as event_name,
  count(*) as total_preregistered,
  count(*) filter (where pr.resolved_user_id is not null) as resolved,
  count(*) filter (where pr.resolved_user_id is null) as unresolved,
  round(100.0 * count(*) filter (where pr.resolved_user_id is not null) / nullif(count(*), 0), 1) as resolution_rate_pct,
  -- Of resolved, how many actually entered?
  count(distinct sc.user_id) filter (where sc.channel = 'entry') as resolved_and_entered
from public.pre_registrations pr
join public.events e on e.id = pr.event_id
left join public.scans sc on sc.user_id = pr.resolved_user_id and sc.event_id = pr.event_id
group by pr.event_id, e.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Grant read access to the anon and authenticated roles
-- (Metabase connects via the Supabase connection string which uses the
-- postgres role, so these grants are mainly for in-app dashboard queries)
-- ═══════════════════════════════════════════════════════════════════════════
grant select on public.v_event_kpis to anon, authenticated;
grant select on public.v_stand_performance to anon, authenticated;
grant select on public.v_hourly_scans to anon, authenticated;
grant select on public.v_engagement_funnel to anon, authenticated;
grant select on public.v_education_breakdown to anon, authenticated;
grant select on public.v_field_interest to anon, authenticated;
grant select on public.v_dwell_distribution to anon, authenticated;
grant select on public.v_lead_quality_by_school to anon, authenticated;
grant select on public.v_group_performance to anon, authenticated;
grant select on public.v_prereg_funnel to anon, authenticated;
