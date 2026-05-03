-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016 — Auto-Scoring Trigger (FINAL)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. SCORING FUNCTION ──────────────────────────────────────────────────
create or replace function public.fn_recalc_student_score(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_role text;
  v_stand_count int;
  v_conf_count int;
  v_appt_count int;
  v_dwell numeric;
  v_wishlist_len int;
  v_branches_len int;
  v_raw_score numeric;
  v_final_score int;
  v_level text;
  v_orientation int;
begin
  select role into v_role from public.users where id = p_user_id;
  if v_role is null or v_role != 'student' then return; end if;

  select count(distinct stand_id) into v_stand_count
    from public.scans
   where user_id = p_user_id and channel = 'stand' and stand_id is not null;

  select count(*) into v_conf_count
    from public.scans
   where user_id = p_user_id and channel = 'conference';

  select count(*) into v_appt_count
    from public.appointments
   where student_id = p_user_id and status != 'cancelled';

  select coalesce(sum(dwell), 0) into v_dwell
    from (
      select extract(epoch from (max(s.created_at) - min(s.created_at))) / 60.0 as dwell
      from public.scans s
      where s.user_id = p_user_id
      group by s.event_id
      having count(*) > 1
    ) sub;

  select coalesce(array_length(wishlist, 1), 0),
         coalesce(array_length(education_branches, 1), 0)
    into v_wishlist_len, v_branches_len
    from public.users where id = p_user_id;

  v_raw_score :=
      (v_stand_count * 5)
    + (v_conf_count * 8)
    + (v_appt_count * 15)
    + least(v_dwell * 0.1, 20)
    + (case when v_wishlist_len > 0 then 3 else 0 end)
    + (case when v_branches_len > 0 then 2 else 0 end);

  v_final_score := least(v_raw_score::int, 100);

  if v_final_score >= 60 then v_level := 'high';
  elsif v_final_score >= 30 then v_level := 'medium';
  else v_level := 'low';
  end if;

  v_orientation := least(
    (case when v_branches_len > 0 then v_branches_len * 8 else 0 end)
    + (case when v_wishlist_len > 0 then v_wishlist_len * 3 else 0 end)
    + (v_stand_count * 4)
    + (v_appt_count * 10)
    + (case when v_conf_count > 0 then 10 else 0 end)
  , 100);

  update public.users set
    intent_score = v_final_score,
    intent_level = v_level,
    orientation_score = v_orientation,
    orientation_stage = (case
      when v_orientation >= 66 then 'deciding'
      when v_orientation >= 33 then 'comparing'
      else 'exploring'
    end)::orientation_stage,
    last_dwell_minutes = case when v_dwell > 0 then v_dwell::int else last_dwell_minutes end,
    updated_at = now()
  where id = p_user_id;
end;
$$;

-- ─── 2. TRIGGER ON SCANS ─────────────────────────────────────────────────
create or replace function public.trg_score_after_scan()
returns trigger language plpgsql security definer as $$
begin perform public.fn_recalc_student_score(NEW.user_id); return NEW; end; $$;

drop trigger if exists trg_recalc_score_on_scan on public.scans;
create trigger trg_recalc_score_on_scan
  after insert on public.scans for each row execute function public.trg_score_after_scan();

-- ─── 3. TRIGGER ON APPOINTMENTS ──────────────────────────────────────────
create or replace function public.trg_score_after_appointment()
returns trigger language plpgsql security definer as $$
begin perform public.fn_recalc_student_score(NEW.student_id); return NEW; end; $$;

drop trigger if exists trg_recalc_score_on_appointment on public.appointments;
create trigger trg_recalc_score_on_appointment
  after insert or update on public.appointments for each row execute function public.trg_score_after_appointment();

-- ─── 4. FIRST RETROACTIVE SCORING ────────────────────────────────────────
do $$ declare r record; begin
  for r in select id from public.users where role = 'student' loop
    perform public.fn_recalc_student_score(r.id);
  end loop;
end; $$;

-- ─── 5. SEED DEMO DATA ──────────────────────────────────────────────────
-- Clean old demo scans (scans table has user_id column)
delete from public.scans
where user_id::text like 'dd0000%'
  and event_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  and created_at < '2026-04-19';

-- Entry scans (users table has id column, not user_id)
insert into public.scans (user_id, event_id, channel, created_at)
select
  id,
  'a1b2c3d4-0000-0000-0000-000000000001',
  'entry',
  '2026-04-18'::timestamp
    + (7 + floor(random() * 3)) * interval '1 hour'
    + floor(random() * 60) * interval '1 minute'
from public.users
where id::text like 'dd0000%' and role = 'student'
on conflict do nothing;

-- Stand + conference scans + appointments
do $$
declare
  v_event uuid := 'a1b2c3d4-0000-0000-0000-000000000001';
  v_stands uuid[];
  v_stu record;
  v_ns int; v_nc int; v_na int;
  v_t timestamp; v_base timestamp;
  i int;
begin
  select array_agg(id) into v_stands from public.stands where event_id = v_event;
  if v_stands is null or array_length(v_stands, 1) = 0 then
    raise notice 'No stands for Paris — skipping.'; return;
  end if;

  for v_stu in
    select id, row_number() over (order by id) as rn
    from public.users
    where id::text like 'dd0000%' and role = 'student'
  loop
    if v_stu.rn <= 8 then
      v_ns := 5 + floor(random()*4)::int; v_nc := 2 + floor(random()*2)::int; v_na := 1 + floor(random()*2)::int;
    elsif v_stu.rn <= 20 then
      v_ns := 3 + floor(random()*2)::int; v_nc := floor(random()*2)::int; v_na := floor(random()*2)::int;
    else
      v_ns := 1 + floor(random()*2)::int; v_nc := 0; v_na := 0;
    end if;
    v_ns := least(v_ns, array_length(v_stands, 1));
    v_base := '2026-04-18 08:00:00'::timestamp + floor(random()*120) * interval '1 minute';

    for i in 1..v_ns loop
      v_t := v_base + (i*20 + floor(random()*15)) * interval '1 minute';
      insert into public.scans (user_id, event_id, stand_id, channel, created_at)
      values (v_stu.id, v_event, v_stands[1+((i-1) % array_length(v_stands,1))], 'stand', v_t)
      on conflict do nothing;
    end loop;

    for i in 1..v_nc loop
      v_t := v_base + (v_ns*20 + 30 + i*45) * interval '1 minute';
      insert into public.scans (user_id, event_id, channel, created_at)
      values (v_stu.id, v_event, 'conference', v_t)
      on conflict do nothing;
    end loop;

    for i in 1..v_na loop
      begin
        insert into public.appointments (student_id, school_id, event_id, slot_time, status, slot_duration)
        values (
          v_stu.id,
          (select school_id from public.stands where id = v_stands[i] limit 1),
          v_event,
          v_base + (v_ns*20 + v_nc*45 + 60 + i*30) * interval '1 minute',
          case when random() > 0.3 then 'confirmed' else 'pending' end,
          15
        );
      exception when others then null;
      end;
    end loop;
  end loop;
end;
$$;

-- ─── 6. FINAL RETROACTIVE SCORING ───────────────────────────────────────
do $$ declare r record; begin
  for r in select id from public.users where role = 'student' loop
    perform public.fn_recalc_student_score(r.id);
  end loop;
end; $$;

-- ─── 7. POSTAL CODES ────────────────────────────────────────────────────
update public.users set postal_code = '75001' where id = 'dd000001-0000-0000-0000-000000000001';
update public.users set postal_code = '75011' where id = 'dd000002-0000-0000-0000-000000000002';
update public.users set postal_code = '75015' where id = 'dd000003-0000-0000-0000-000000000003';
update public.users set postal_code = '75020' where id = 'dd000004-0000-0000-0000-000000000004';
update public.users set postal_code = '92100' where id = 'dd000005-0000-0000-0000-000000000005';
update public.users set postal_code = '93200' where id = 'dd000006-0000-0000-0000-000000000006';
update public.users set postal_code = '94200' where id = 'dd000007-0000-0000-0000-000000000007';
update public.users set postal_code = '78000' where id = 'dd000008-0000-0000-0000-000000000008';
update public.users set postal_code = '91000' where id = 'dd000009-0000-0000-0000-000000000009';
update public.users set postal_code = '95000' where id = 'dd000010-0000-0000-0000-000000000010';
update public.users set postal_code = '75005' where id = 'dd000011-0000-0000-0000-000000000011';
update public.users set postal_code = '75013' where id = 'dd000012-0000-0000-0000-000000000012';
update public.users set postal_code = '93100' where id = 'dd000013-0000-0000-0000-000000000013';
update public.users set postal_code = '92200' where id = 'dd000014-0000-0000-0000-000000000014';
update public.users set postal_code = '94100' where id = 'dd000015-0000-0000-0000-000000000015';
update public.users set postal_code = '77100' where id = 'dd000016-0000-0000-0000-000000000016';
update public.users set postal_code = '60200' where id = 'dd000017-0000-0000-0000-000000000017';
update public.users set postal_code = '75009' where id = 'dd000018-0000-0000-0000-000000000018';
update public.users set postal_code = '92300' where id = 'dd000019-0000-0000-0000-000000000019';
update public.users set postal_code = '75018' where id = 'dd000020-0000-0000-0000-000000000020';
update public.users set postal_code = '93300' where id = 'dd000021-0000-0000-0000-000000000021';
update public.users set postal_code = '91400' where id = 'dd000022-0000-0000-0000-000000000022';
update public.users set postal_code = '78100' where id = 'dd000023-0000-0000-0000-000000000023';
update public.users set postal_code = '95100' where id = 'dd000024-0000-0000-0000-000000000024';
update public.users set postal_code = '77000' where id = 'dd000025-0000-0000-0000-000000000025';
update public.users set postal_code = '75003' where id = 'dd000026-0000-0000-0000-000000000026';
update public.users set postal_code = '92400' where id = 'dd000027-0000-0000-0000-000000000027';
update public.users set postal_code = '93400' where id = 'dd000028-0000-0000-0000-000000000028';
update public.users set postal_code = '94300' where id = 'dd000029-0000-0000-0000-000000000029';
update public.users set postal_code = '75016' where id = 'dd000030-0000-0000-0000-000000000030';