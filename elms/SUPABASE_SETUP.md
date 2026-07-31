# Connecting ELMS to your own Supabase project

ELMS talks to Supabase as **plain Postgres** over `pg` — no Supabase SDK, no RLS,
no Supabase Auth. Authentication is your own JWT layer, so all you need from
Supabase is the database connection string.

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Pick a name, region, and a strong **database password** — save it, you need it in step 2.
3. Wait for provisioning to finish (~1 min).

## 2. Get the connection string

Dashboard → **Project Settings → Database → Connection string → URI**.

It looks like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
```

- Replace `[YOUR-PASSWORD]` with the password from step 1.
- If the password contains `@ : / ? # & %`, URL-encode it (`@` → `%40`, `#` → `%23`, …).
- **Direct connection is IPv6-only.** If your network/host has no IPv6 (common on
  Windows, some ISPs, Render/Heroku free tiers), use the **Session Pooler** URI on
  the same page instead — it's IPv4 and works identically here:
  `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`

## 3. Configure the server env

```bash
cd elms/server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://postgres:YOUR_ENCODED_PASSWORD@db.<ref>.supabase.co:5432/postgres
PGSSL=true

# openssl rand -hex 64
JWT_SECRET=<paste a 128-char hex string here>
JWT_EXPIRES_IN=2h
BCRYPT_ROUNDS=12

MANAGER_USERNAME=manager@gcu.in
MANAGER_SEED_PASSWORD=<a strong password you choose>
# optional demo employee
DEMO_EMPLOYEE_USERNAME=employee@gcu.in
DEMO_EMPLOYEE_PASSWORD=<a strong password you choose>

MAX_UPLOAD_MB=5
UPLOAD_DIR=uploads
```

`.env` is gitignored — never commit it. A missing `DATABASE_URL` or `JWT_SECRET`
crashes the server at boot on purpose (see `src/config/env.js`).

Generate the secret:

```bash
openssl rand -hex 64
# Windows PowerShell:
# -join ((1..64) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

## 4. Install, verify, migrate, seed

```bash
cd elms/server
npm install
npm run db:check   # proves the connection works, lists missing tables
npm run schema     # creates users + leave_requests (idempotent)
npm run seed       # creates the single manager (+ optional demo employee)
npm run db:check   # should now show OK / OK and managers=1
```

`schema.sql` is safe to run repeatedly: every statement is `IF NOT EXISTS` or
guarded by a `DO $$` block.

You can also paste `server/schema.sql` into the Supabase **SQL Editor** if you
prefer running the migration from the dashboard — the result is identical.

## 5. Client env

```bash
cd elms/client
cp .env.example .env    # VITE_API_URL=http://localhost:4000/api
npm install
```

## 6. Run both processes

```bash
# terminal 1
cd elms/server && npm run dev     # http://localhost:4000

# terminal 2
cd elms/client && npm run dev     # http://localhost:5173
```

Sign in as the manager with `MANAGER_USERNAME` / `MANAGER_SEED_PASSWORD`, or
register a new employee from the UI.

---

## Notes and gotchas

- **Uploads stay on disk** (`server/uploads/`), not in Supabase Storage. Files are
  served only through the authenticated `GET /api/leaves/:id/document` route, which
  checks that the caller is the manager or the owning employee. If you deploy to an
  ephemeral filesystem (Render, Fly, Vercel), switch to Supabase Storage or an
  attached volume — nothing else in the code changes.
- **RLS is irrelevant here.** The server connects as the `postgres` role and
  authorization is enforced in Express (`requireRole` + per-row ownership checks in
  SQL `WHERE` clauses). Do not expose this database's credentials to a browser.
- **Only one manager can exist** — enforced by a partial unique index in
  `schema.sql` and by `register` hardcoding `role = 'employee'`.
- **Tests** (`npm test` in `server/`) hit the real `DATABASE_URL`. Point them at a
  separate Supabase project or a local Postgres if you don't want test rows in your
  main database.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `getaddrinfo ENOTFOUND db.<ref>.supabase.co` | Wrong project ref, or no IPv6 — use the Session Pooler URI. |
| `password authentication failed` | Password not replaced, or special characters not URL-encoded. |
| `self signed certificate` / SSL errors | Keep `PGSSL=true`; the pool already uses `rejectUnauthorized: false`. |
| `Missing required environment variable` at boot | `.env` is not in `elms/server/`, or the key is blank. |
| CORS error in the browser | `CORS_ORIGIN` must exactly match the Vite origin, e.g. `http://localhost:5173`. |
