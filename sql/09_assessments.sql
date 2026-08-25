-- ============================================================
-- PD — functional assessments
--
-- What a person can actually do, measured. This is what replaces guessing a
-- body from a birthday: chronological age is the estimate you use when you
-- have nothing better, and a row in this table is the measurement that
-- replaces it. See claude/pd-design-principle.md.
--
-- APPEND ONLY. Never update a row here, never delete one. The history IS the
-- feature — progression is two rows compared, and an assessment that gets
-- overwritten destroys the only thing that makes the number worth taking.
-- ============================================================

create table if not exists public.assessments (
  id           bigint generated always as identity primary key,
  client_id    bigint not null references public.clients(id) on delete cascade,

  assessed_at  date not null default current_date,

  -- 'trainer' or 'self'. Not cosmetic: a level a trainer watched is worth
  -- more than one a person ticked about themselves, and anyone reading the
  -- history later needs to know which they are looking at.
  assessed_by  text not null default 'trainer',

  -- { sit_to_stand: 2, single_leg: 1, tandem: 0, gait: 2, floor_transfer: 1, overhead: 3 }
  -- Keys and levels are defined in src/assessment.js. Stored as jsonb so a
  -- new capability is a new key, not a migration.
  levels       jsonb not null default '{}'::jsonb,

  -- { chair_stand_30s: 9, single_leg_hold: {"left": 4, "right": 6}, ... }
  tests        jsonb not null default '{}'::jsonb,

  -- PAR-Q taken at the same sitting. The trainer screens the person in front
  -- of him; this is where that gets recorded. clients.parq_answers holds the
  -- CURRENT state, this holds what was answered on the day.
  parq_answers jsonb,

  notes        text,
  created_at   timestamptz not null default now()
);

-- The only query that matters: this client's assessments, newest first.
create index if not exists assessments_client_time_idx
  on public.assessments (client_id, assessed_at desc);

comment on table public.assessments is
  'Append-only record of what a client could do on a given day. Progression is two rows compared. Never update or delete.';
comment on column public.assessments.assessed_by is
  'trainer | self — a level someone watched is not the same evidence as a level someone reported.';

alter table public.assessments enable row level security;
-- No policies. The anon key is denied; the service role bypasses RLS, and
-- every read and write goes through /api with a checked token.

-- ------------------------------------------------------------
-- Someone's progression, in one query:
--
--   select assessed_at,
--          levels->>'single_leg'      as single_leg,
--          levels->>'sit_to_stand'    as sit_to_stand,
--          tests->>'chair_stand_30s'  as chair_stand
--   from public.assessments
--   where client_id = 8
--   order by assessed_at;
--
-- Verify:
--   select relname, relrowsecurity from pg_class where relname = 'assessments';
-- ------------------------------------------------------------
