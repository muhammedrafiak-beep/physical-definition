# PD client auth migration — cutover steps

This removes the worst finding in the August security audit: client passwords
stored in plaintext and compared in the browser, with the whole `clients` table
readable using the anon key.

**What this step does and does not do.** After this, passwords are hashed and
verified server-side, and login no longer needs the clients table in the
browser. RLS is *not* locked down yet — the admin screens still read `clients`
directly. That is the next step, after the admin data path also moves
server-side. Don't run the lockdown SQL until then.

Zero new dependencies. Hashing uses node's built-in `scrypt`.

---

## Files

```
api/_lib/password.js     scrypt hash + verify
api/_lib/session.js      HMAC-signed session token
api/client-login.js      POST endpoint
sql/03_client_password_hash.sql
```

Plus three edits to `src/App.jsx` (see the patch, or "Manual edit" below).

---

## Order of operations

Do these in order. Steps 1–3 change nothing for existing users, so you can
pause safely after any of them.

### 1. Run the SQL

Supabase → SQL editor → run `sql/03_client_password_hash.sql`.
Additive only: it adds a nullable `password_hash` column.

### 2. Set the environment variables

Vercel → Project → Settings → Environment Variables. Add all three to
**Production, Preview and Development**:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://<your-project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` |
| `SESSION_SECRET` | `openssl rand -hex 32` |

> The service role key bypasses every RLS policy. It must never be given a
> `VITE_` prefix — Vite inlines those straight into the browser bundle. If it
> ever leaks, rotate it in Supabase → Settings → API immediately.

Add the same three to your local `.env.local` so `vercel dev` works, and
confirm `.env.local` is in `.gitignore`.

### 3. Copy the files in and deploy

```bash
cp -r api/_lib api/client-login.js  <your-repo>/api/
git apply pd-client-auth.patch      # or make the three edits by hand
npm run dev
```

### 4. Test before you tell anyone

Use a throwaway client row, not your own account.

- [ ] Correct email + password → logs in, portal loads normally
- [ ] Wrong password → "Invalid email or password"
- [ ] Unknown email → the *same* message, and takes about as long
- [ ] A client with `status` not `Active` → disabled message
- [ ] In Supabase, that client's row now has `password_hash` set and
      `password` is `null`
- [ ] Log in again as the same client → still works (now via the hash)
- [ ] Open devtools → Network → the login response contains **no**
      `password` or `password_hash` field

### 5. Get every active client to log in once

Migration happens on login. Until a client signs in, their row still holds a
plaintext password. Message the ones who haven't — a nudge to open the app is
enough.

Track it:

```sql
select count(*) total,
       count(password_hash) migrated,
       count(*) filter (where password is not null) still_plaintext
from public.clients where status = 'Active';
```

### 6. Drop the plaintext column

Only when `still_plaintext` is 0 for active clients, and after a backup.
The statement is at the bottom of `sql/03_client_password_hash.sql`.

---

## Rollback

Nothing is destructive until step 6.

- Revert the `src/App.jsx` edits and redeploy — login goes back to the old
  browser-side check.
- Any client already migrated has `password = null`, so the old check will
  fail for them. To rescue one: set a new password in the admin screen, or
  `update clients set password = '<new>' where id = <id>;` and send it to them.
- The `password_hash` column can stay; it does no harm.

---

## Manual edit (if `git apply` conflicts)

The earlier admin-auth fix also touched `login()`, so the patch may not apply
cleanly. All three edits are in `src/App.jsx`:

**1.** Beside `const [lErr, setLErr] = useState("");` add:

```js
const [lBusy, setLBusy] = useState(false);
```

**2.** Replace the client branch of `login()` — the two lines starting
`const c = clients.find(...)` — with the `fetch("/api/client-login", …)` block
from the patch. Make `login` `async`. Keep whatever the admin branch looks like
in your copy; this change doesn't touch it.

**3.** In `logout()`, also remove `pd_token` from `sessionStorage`.

---

## Still open after this

- Admin screens read `clients` from the browser → move to a server endpoint,
  then run the RLS lockdown.
- `ADMIN = { u, p }` is still in the client bundle if you haven't applied the
  earlier admin-auth fix.
- The "share credentials on WhatsApp" feature reads `c.password`. Once
  hashing is complete there is nothing to read — switch it to generating and
  setting a new password instead.
- No real rate limiting on the login endpoint. The 250 ms delay slows casual
  guessing; add proper per-IP limiting before you open signups to strangers.
