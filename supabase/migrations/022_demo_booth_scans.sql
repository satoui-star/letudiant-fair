-- 017_demo_booth_scans.sql
-- Generates demo booth entry scans for testing BoothVisit component.
-- Safe to run multiple times: uses on conflict do nothing.

do $$
declare
  v_student    record;
  v_stand      record;
  v_event_id   uuid;
  v_event_date date;
  v_scan_time  timestamptz;
  i            int := 0;
begin
  -- Pick the event whose date is closest to today
  select id, event_date
  into v_event_id, v_event_date
  from public.events
  order by abs(event_date - current_date)
  limit 1;

  if v_event_id is null then
    raise notice '017_demo_booth_scans: no active event found, skipping.';
    return;
  end if;

  -- For each of the first 10 students, create 1–2 booth entry scans
  for v_student in
    select id from public.users where role = 'student' order by random() limit 10
  loop
    for v_stand in
      select id from public.stands where event_id = v_event_id order by random() limit (1 + (floor(random() * 2))::int)
    loop
      -- Skip if scan already exists for this student+stand combo
      if exists (
        select 1 from public.scans
        where user_id = v_student.id
          and stand_id = v_stand.id
          and channel = 'entry'
      ) then
        continue;
      end if;

      -- Generate a scan time somewhere on the event date, between 09:00 and 17:00
      v_scan_time := (v_event_date::text || ' ' ||
                     to_char((9 + floor(random() * 8))::int, 'FM00') || ':' ||
                     to_char((floor(random() * 60))::int, 'FM00') || ':00')::timestamptz;

      insert into public.scans (
        user_id, event_id, stand_id, channel, created_at
      ) values (
        v_student.id, v_event_id, v_stand.id, 'entry', v_scan_time
      ) on conflict do nothing;

      i := i + 1;
    end loop;
  end loop;

  raise notice '017_demo_booth_scans: done — % booth entry scans created.', i;
end $$;
