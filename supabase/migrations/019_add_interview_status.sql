-- ============================================================================
-- 019_add_interview_status.sql
--
-- Purpose:
--   Add 'interview' value to the dossier_status enum so students can track
--   the interview stage of their application process.
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'dossier_status' and e.enumlabel = 'interview'
  ) then
    alter type dossier_status add value 'interview' before 'completed';
  end if;
end $$;
