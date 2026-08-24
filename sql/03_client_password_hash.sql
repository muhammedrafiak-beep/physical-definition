-- ============================================================
-- PD — client auth migration, step 1 of 3
-- Adds the column that /api/client-login writes hashes into.
-- Safe to run on the live database: additive only, nothing breaks.
-- ============================================================

alter table public.clients
  add column if not exists password_hash text;

comment on column public.clients.password_hash is
  'scrypt$N$r$p$salt$hash. Written by /api/client-login on first successful login (migrate-on-login). When every active client has one, the legacy plaintext password column can be dropped.';

-- ------------------------------------------------------------
-- Watch the migration progress. Run this after clients start logging in:
-- ------------------------------------------------------------
--   select
--     count(*)                                          as total,
--     count(password_hash)                              as migrated,
--     count(*) filter (where password is not null)      as still_plaintext
--   from public.clients
--   where status = 'Active';

-- ------------------------------------------------------------
-- STEP 3 — only once still_plaintext is 0 for every ACTIVE client.
-- Inactive clients who never log in again will keep a plaintext password
-- forever, so deal with them deliberately rather than waiting.
--
-- Before dropping, take a backup. This is not reversible.
-- ------------------------------------------------------------
--   alter table public.clients drop column password;
--
-- Note: the admin "share credentials on WhatsApp" feature in App.jsx sends
-- c.password. Once the column is gone that breaks — switch it to sending a
-- freshly generated password that you also set, rather than reading back a
-- stored one. You should not be able to read a client's password anyway;
-- that is the point of hashing it.
