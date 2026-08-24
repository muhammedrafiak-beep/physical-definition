-- ============================================================
-- PD — Phase 0/1 handover: lock down workout_sets
--
-- RUN THIS ONLY AFTER the client-auth migration is live, i.e. after
-- client login goes through a server endpoint using the SERVICE ROLE key
-- instead of browser-side queries with the anon key.
--
-- Running it before that will break set logging in the app.
-- ============================================================

-- 1. Remove the permissive interim policy from 01_workout_sets.sql
drop policy if exists workout_sets_interim_anon on public.workout_sets;

-- 2. Deny the browser outright.
--    The service role bypasses RLS, so your server endpoints keep working.
--    With RLS enabled and no policy granting anon access, anon gets nothing.
--    (No policy needed for the service role — it is exempt by design.)

-- 3. If you later move clients onto Supabase Auth (recommended eventually),
--    replace step 2 with real per-client policies. Uncomment then:
--
-- create policy workout_sets_own_rows_select
--   on public.workout_sets for select to authenticated
--   using (client_id = auth.jwt() ->> 'client_id');
--
-- create policy workout_sets_own_rows_insert
--   on public.workout_sets for insert to authenticated
--   with check (client_id = auth.jwt() ->> 'client_id');

-- ------------------------------------------------------------
-- Do the same for the tables that already exist and are currently open.
-- Check what is there before running — do not drop a policy blind.
-- ------------------------------------------------------------
--   select tablename, policyname, roles, cmd, qual
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--
-- Expect to find permissive policies on: clients, registrations,
-- workout_logs, progress_photos. The clients table is the urgent one —
-- it holds names, phone numbers and (still) plaintext passwords.

-- ============================================================
-- Verify the browser really is locked out:
--   set role anon;
--   select * from public.workout_sets;   -- expect 0 rows / permission denied
--   reset role;
-- ============================================================
