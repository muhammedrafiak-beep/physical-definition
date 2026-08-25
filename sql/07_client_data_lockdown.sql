-- ============================================================
-- PD — Stage 3 lockdown: progress photos and workout logs
--
-- Until now the browser read and wrote both of these with the ANON key. That
-- key is public — it ships inside the JavaScript bundle — so anyone could
-- read every client's progress photos, weights and notes, and file workout
-- logs in anyone's name.
--
-- From here both go through /api/client-data, which reads the client id out of
-- a signed session token. This file removes the browser's own way in.
--
-- Run the whole thing in one go. Nothing here deletes data.
-- ============================================================

-- ── 1. The tables ────────────────────────────────────────────
-- RLS with NO policies denies the anon key completely. The service role — the
-- only key the API uses, and one that never reaches a browser — bypasses RLS,
-- so /api/client-data keeps working exactly as before.

alter table public.progress_photos enable row level security;
alter table public.workout_logs    enable row level security;

-- ── 2. The bucket ────────────────────────────────────────────
-- This is the part that is easy to miss and matters most.
--
-- `progress-photos` is currently a PUBLIC bucket, which means every file in it
-- is readable by URL by anyone, whatever the table above says. Locking the
-- table while the bucket stays public protects the index and leaves the
-- photographs open. So: make it private.
--
-- Existing photos do not break. /api/client-data signs a fresh one-hour URL
-- for each one when a client opens their progress screen.

update storage.buckets set public = false where id = 'progress-photos';

-- ── 3. Check nothing else lets the anon key in ───────────────
-- If you ever added a storage policy by hand, it can still allow reads on a
-- private bucket. Run this and look at what comes back:
--
--   select policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
--
-- Anything mentioning progress-photos that is granted to `anon` or `public`
-- should be dropped:
--
--   drop policy "<name>" on storage.objects;
--
-- Policies for exercise-photos and exercise-videos are fine — those buckets
-- are meant to be public, they hold the app's own artwork.

-- ── 4. Confirm it worked ─────────────────────────────────────
-- Expect: rls_enabled = true for both tables, public = false for the bucket.
--
--   select relname as table_name, relrowsecurity as rls_enabled
--   from pg_class
--   where relname in ('progress_photos', 'workout_logs', 'clients', 'registrations');
--
--   select id, public from storage.buckets;

-- ------------------------------------------------------------
-- STILL OPEN AFTER THIS FILE — deliberately, not by oversight:
--
--   pd_scores is read AND written from the browser with the anon key. The
--   leaderboard is meant to be public, so the reads are fine. The writes are
--   not: anyone can insert a fake score. Nobody's privacy leaks, so it is not
--   in this pass — but it should move behind the client token before the
--   leaderboard means anything to anyone.
-- ------------------------------------------------------------
