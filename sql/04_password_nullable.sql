-- ============================================================
-- PD — client auth migration, step 2 of 3
--
-- `clients.password` was created NOT NULL. migrate-on-login clears the
-- plaintext after hashing, so that constraint made every migration fail —
-- silently, because a failed migration deliberately does not block a login.
-- Symptom: clients could sign in normally, but password_hash stayed null
-- and the plaintext stayed in the table.
--
-- Additive/relaxing only. No data changes. Already applied 24 Aug 2026.
-- ============================================================

alter table public.clients
  alter column password drop not null;

-- ------------------------------------------------------------
-- Migration progress. Run this periodically until still_plaintext is 0
-- for every ACTIVE client — that is the gate for dropping the column.
-- ------------------------------------------------------------
--   select
--     count(*)                                      as total,
--     count(password_hash)                          as migrated,
--     count(*) filter (where password is not null)  as still_plaintext
--   from public.clients
--   where status = 'Active';

-- Clients who have not logged in since the cutover, i.e. still plaintext:
--   select id, name, email
--   from public.clients
--   where status = 'Active' and password is not null
--   order by name;
