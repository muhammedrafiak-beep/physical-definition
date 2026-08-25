-- ============================================================
-- PD — per-set logging, table + lockdown in one file
--
-- Supersedes sql/01_workout_sets.sql and sql/02_workout_sets_lockdown.sql.
-- Everything here is `if not exists` / idempotent, so it is safe whether or
-- not 01 was ever run, and safe to run twice.
--
-- What this table is FOR, so it doesn't get treated as optional: a workout_log
-- row says "you trained on Tuesday". These rows say "you pressed 42.5 kg for
-- 10, and last month it was 37.5". That difference is the whole reason someone
-- opens a training app a second time.
-- ============================================================

create table if not exists public.workout_sets (
  id            bigint generated always as identity primary key,

  -- which session this set belongs to
  -- uuid, NOT bigint. workout_logs.id is a uuid; sql/01_workout_sets.sql
  -- assumed bigint and could therefore never run at all.
  session_id    uuid   not null references public.workout_logs(id) on delete cascade,

  -- denormalised so a set stays readable if a session row is ever rebuilt
  client_id     text   not null,

  exercise_id   text,
  exercise_name text   not null,

  set_no        smallint not null check (set_no between 1 and 30),

  -- the three numbers progressive overload is built on
  weight_kg     numeric(6,2) check (weight_kg >= 0 and weight_kg < 1000),
  reps_done     smallint     check (reps_done >= 0 and reps_done <= 500),
  rir           smallint     check (rir between 0 and 10),   -- reps in reserve

  -- for timed work (planks, carries, intervals) instead of reps
  duration_sec  integer      check (duration_sec >= 0),

  is_warmup     boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),

  unique (session_id, exercise_name, set_no)
);

-- "what did I lift last time?" — the single most important query in the app.
create index if not exists workout_sets_lastseen_idx
  on public.workout_sets (client_id, exercise_name, created_at desc);

create index if not exists workout_sets_session_idx
  on public.workout_sets (session_id);

comment on table public.workout_sets is
  'One row per working set. Progressive overload lives here; without it PD cannot show a client they are getting stronger.';

-- ── Lockdown ────────────────────────────────────────────────
-- 01_workout_sets.sql created a deliberately permissive interim policy that
-- let the anon key read and write every row, because the app had no client
-- authentication at the time. It does now: everything goes through
-- /api/client-data with a signed token and the service role. Drop it.

alter table public.workout_sets enable row level security;

drop policy if exists workout_sets_interim_anon on public.workout_sets;

-- No policies at all. RLS with zero policies denies the anon key completely
-- while the service role, which bypasses RLS, keeps working.

-- ------------------------------------------------------------
-- Verify — expect one row, rls_on = true, and NO policies listed:
--
--   select relname, relrowsecurity as rls_on
--   from pg_class where relname = 'workout_sets';
--
--   select policyname from pg_policies
--   where schemaname = 'public' and tablename = 'workout_sets';
--
-- After a logged workout, this is the query worth watching:
--
--   select exercise_name, set_no, weight_kg, reps_done, created_at
--   from public.workout_sets
--   order by created_at desc limit 20;
-- ------------------------------------------------------------
