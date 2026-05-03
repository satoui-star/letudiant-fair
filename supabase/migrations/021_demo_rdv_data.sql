-- 016_demo_rdv_data.sql
-- Generates realistic randomised demo appointments using live IDs only.
-- Safe to run multiple times: inserts only when student+school+event combo
-- does not already have an active (non-cancelled) appointment.

do $$
declare
  v_student   record;
  v_school    record;
  v_event_id  uuid;
  v_event_date date;
  v_slot      timestamptz;
  v_status    appointment_status;
  v_notes     text[];
  v_note      text;
  v_slots     text[] := array[
    '09:00','09:15','09:30','09:45',
    '10:00','10:15','10:30','10:45',
    '11:00','11:15','11:30','11:45',
    '13:00','13:15','13:30','13:45',
    '14:00','14:15','14:30','14:45',
    '15:00','15:15','15:30'
  ];
  v_statuses  appointment_status[] := array['pending','pending','pending','confirmed','confirmed']::appointment_status[];
  i           int;
begin
  -- Pick the event whose date is closest to today
  select id, event_date
  into v_event_id, v_event_date
  from public.events
  order by abs(event_date - current_date)
  limit 1;

  if v_event_id is null then
    raise notice '016_demo_rdv: no active event found, skipping.';
    return;
  end if;

  v_notes := array[
    'Je voudrais en savoir plus sur les débouchés après le diplôme.',
    'Quelles sont les conditions d''admission en première année ?',
    'Est-ce que vous proposez des stages à l''international ?',
    'Je m''intéresse surtout à la filière alternance.',
    'Pouvez-vous m''expliquer le déroulé des cours ?',
    null, null  -- some appointments without notes
  ];

  i := 0;

  -- One appointment per student × school pair (up to 3 schools per student)
  for v_student in
    select id from public.users where role = 'student' order by random() limit 20
  loop
    for v_school in
      select id from public.schools order by random() limit 3
    loop
      -- Skip if a non-cancelled appointment already exists for this combo
      if exists (
        select 1 from public.appointments
        where student_id = v_student.id
          and school_id  = v_school.id
          and event_id   = v_event_id
          and status    <> 'cancelled'
      ) then
        continue;
      end if;

      -- Pick a random slot from the array
      v_slot := (v_event_date::text || ' ' || v_slots[1 + (i % array_length(v_slots, 1))])::timestamptz;
      i := i + 1;

      -- Random status (weighted towards pending)
      v_status := v_statuses[1 + (floor(random() * array_length(v_statuses, 1)))::int];

      -- Random note (may be null)
      v_note := v_notes[1 + (floor(random() * array_length(v_notes, 1)))::int];

      insert into public.appointments (
        student_id, school_id, event_id,
        slot_time, slot_duration,
        status, student_notes
      ) values (
        v_student.id, v_school.id, v_event_id,
        v_slot, 15,
        v_status, v_note
      );

    end loop;
  end loop;

  raise notice '016_demo_rdv: done — % slot base used.', i;
end $$;
