-- ============================================================
-- PD — Phase 1, step 1: per-set logging
-- Run this in the Supabase SQL editor.
-- Safe to run on the live database: it only ADDS a table.
-- ============================================================

create table if not exists public.workout_sets (
  id            bigint generated always as identity primary key,

  -- which session this set belongs to
  session_id    bigint not null references public.workout_logs(id) on delete cascade,

  -- denormalised so a set is still readable if a session row is ever rebuilt
  client_id     text   not null,

  -- which movement. exercise_id is the slug from the widened exercise schema
  -- (e.g. "bench-press"); exercise_name is kept so old rows stay readable
  -- if a slug is ever renamed.
  exercise_id   text,
  exercise_name text   not null,

  set_no        smallint not null check (set_no between 1 and 30),

  -- the three numbers the whole premium tier is built on
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

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.workout_sets enable row level security;

-- INTERIM POLICY — matches how the app authenticates TODAY (browser-side
-- queries with the anon key). It is deliberately permissive and is NOT
-- acceptable once you are taking payments.
-- Delete it by running 02_workout_sets_lockdown.sql immediately after the
-- client-auth migration lands.
drop policy if exists workout_sets_interim_anon on public.workout_sets;
create policy workout_sets_interim_anon
  on public.workout_sets
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ============================================================
-- Verify:
--   select count(*) from public.workout_sets;   -- expect 0
-- ============================================================
