-- ============================================================
-- PD — rate limiting
--
-- One row per ALLOWED attempt on a public endpoint. The limiter counts rows
-- in a time window; nothing else reads this table.
--
-- Why the database and not an in-memory counter: a Vercel function is
-- short-lived and many instances run at once, so a counter in process memory
-- sees only a fraction of the traffic and resets whenever an instance is
-- recycled. Against a script that is no protection at all. Every instance has
-- to be looking at the same numbers.
--
-- No email address or IP is stored in the clear. `bucket` holds a hash, so
-- this table never becomes a second copy of who signed in and from where.
-- ============================================================

create table if not exists public.rate_limit_hits (
  id         bigserial   primary key,
  bucket     text        not null,
  created_at timestamptz not null default now()
);

-- The only query the limiter makes: count rows for one bucket since a time.
create index if not exists rate_limit_hits_bucket_time_idx
  on public.rate_limit_hits (bucket, created_at desc);

-- Old rows are purged opportunistically by the app. This makes that cheap.
create index if not exists rate_limit_hits_created_at_idx
  on public.rate_limit_hits (created_at);

comment on table public.rate_limit_hits is
  'Attempt counters for public endpoints. Rows older than 24h are disposable.';
comment on column public.rate_limit_hits.bucket is
  'endpoint + scope + sha256 of the identifier (IP or email). Never the raw value.';

-- The limiter runs with the service role. Nothing in the browser should ever
-- read or write this table.
alter table public.rate_limit_hits enable row level security;
-- No policies, on purpose. RLS with zero policies denies the anon key
-- completely, while the service role — which bypasses RLS — keeps working.

-- ------------------------------------------------------------
-- If you ever lock YOURSELF out (too many failed admin logins),
-- run this and try again straight away:
--
--   delete from public.rate_limit_hits;
--
-- It only throws away counters. Nothing else depends on this table.
--
-- To see whether anyone is actually hammering the site:
--
--   select bucket, count(*), max(created_at)
--   from public.rate_limit_hits
--   where created_at > now() - interval '1 hour'
--   group by bucket
--   order by count(*) desc
--   limit 20;
-- ------------------------------------------------------------
