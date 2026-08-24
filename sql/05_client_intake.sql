-- ============================================================
-- PD — self-serve signup, step 1 of 2
--
-- Columns the intake form fills in. These are what /api/signup uses to pick
-- a training system without a human in the loop, and what the trainer needs
-- to see later to understand why someone got the plan they got.
--
-- Additive only. Existing rows get NULLs and keep working.
-- ============================================================

alter table public.clients
  add column if not exists experience      text,      -- beginner | intermediate | advanced
  add column if not exists days_per_week   smallint,
  add column if not exists equipment       text,      -- full_gym | home_basic | none
  add column if not exists limitation      text,      -- none | knee | back | shoulder
  add column if not exists parq_answers    jsonb,     -- { heart: false, chestPain: false, ... }
  add column if not exists parq_cleared_at timestamptz,
  add column if not exists assigned_reason text,      -- why the app chose this system
  add column if not exists needs_review    boolean not null default false,
  add column if not exists signup_source   text;      -- self_serve | trainer

comment on column public.clients.parq_answers is
  'PAR-Q+ responses at signup. Any true means no automatic programme was given. Kept as the record that screening happened.';
comment on column public.clients.needs_review is
  'The app wants the trainer to look at this client before or soon after they start.';
comment on column public.clients.assigned_reason is
  'Plain-language reason the assignment engine picked this system. Shown to the trainer, not the client.';

-- Same intake fields on registrations — someone the app could NOT assign a
-- programme to still needs their answers kept, or the trainer is starting
-- the conversation blind.
alter table public.registrations
  add column if not exists experience      text,
  add column if not exists days_per_week   smallint,
  add column if not exists equipment       text,
  add column if not exists limitation      text,
  add column if not exists parq_answers    jsonb,
  add column if not exists blocked_reason  text;      -- why signup could not proceed automatically

comment on column public.registrations.blocked_reason is
  'Why the app declined to assign automatically — a PAR-Q flag, or a reported limitation that needs a person.';

-- ------------------------------------------------------------
-- Who is waiting on you:
--   select id, name, email, phone, blocked_reason, submitted_at
--   from public.registrations order by submitted_at desc;
--
--   select id, name, email, assigned_reason
--   from public.clients where needs_review order by id desc;
-- ------------------------------------------------------------
