# ELMS — Employee Leave Management System

A production-shaped leave management app: employees apply for leave with a
supporting document; a single pre-seeded manager reviews and approves/rejects
with mandatory remarks.

**Every rule is enforced on the backend.** The React app is a convenience
layer; assume it can be bypassed with curl and the API still holds.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, React Router, Tailwind CSS |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL (Supabase-compatible connection string) |
| Auth | JWT access token + bcrypt (cost 12) |
| Uploads | Multer, disk storage |
| Validation | Zod (`.strict()` — extra fields rejected) |
| Security | helmet, cors (exact origin), express-rate-limit |
| Tests | Jest + Supertest |

---

## Architecture

```
 Browser (React SPA, :5173)
   │  Authorization: Bearer <JWT>   (axios request interceptor)
   ▼
 Express API (:4000)
   helmet → cors(exact origin) → json/urlencoded
     └─ /api/auth      register | login (rate-limited) | me
     └─ /api/leaves    authenticate → requireRole(...) → controller
     └─ /api/employees authenticate → requireRole('manager')
   errorHandler (logs detail, returns { error })
   │                              │
   ▼                              ▼
 PostgreSQL (pg pool,        server/uploads/  (NOT static;
 parameterized SQL)           served only via gated route)
```

Request path for any protected call:
`route → authenticate (verify JWT) → requireRole → Zod validation →
model (parameterized SQL) → JSON response`.

---

## Setup

> Using your own Supabase project? Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**
> for the connection string, env values, migration and troubleshooting.



```bash
git clone <repo> && cd elms

# 1. Backend env
cd server
cp .env.example .env      # fill DATABASE_URL, JWT_SECRET, MANAGER_SEED_PASSWORD
npm install

# 2. Schema + seed
# 2. Schema + seed
npm run db:check          # verifies DATABASE_URL reaches your Postgres
npm run schema            # applies schema.sql
npm run seed              # creates the single manager (+ optional demo employee)


# 3. Run the API
npm run dev               # http://localhost:4000

# 4. Frontend
cd ../client
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev               # http://localhost:5173
```

Generate a real secret: `openssl rand -hex 64`.

### Tests

```bash
cd server && npm test
```
Point `DATABASE_URL` at a throwaway/test database — the suite creates and
deletes its own user rows and requires `MANAGER_SEED_PASSWORD` to match the
seeded manager.

---

## Sample credentials

These come from **your `.env`**, not from the repo — nothing is hardcoded.

| Role | Username | Password |
|---|---|---|
| Manager | `MANAGER_USERNAME` (default `manager@gcu.in`) | `MANAGER_SEED_PASSWORD` |
| Demo employee | `DEMO_EMPLOYEE_USERNAME` (default `employee@gcu.in`) | `DEMO_EMPLOYEE_PASSWORD` |

Any other employee can self-register at `/register`. **There is no way to
create a manager through the UI or the API** — `POST /api/auth/register`
hardcodes `role='employee'` in SQL, the Zod schema rejects a `role` field
outright, and a partial unique index in `schema.sql` allows at most one
manager row.

---

## API contract

**Auth**
- `POST /api/auth/register` — public, `{ username, password }` → `{ token, role, username }` (always employee)
- `POST /api/auth/login` — public, rate-limited 5/15min/IP → `{ token, role, username }`
- `GET /api/auth/me` — bearer → `{ id, username, role }`

**Employee** (`requireRole('employee')`)
- `POST /api/leaves` — multipart `reason, start_date, end_date, document`
- `GET /api/leaves/mine` — own requests only (filtered in SQL)
- `GET /api/leaves/notifications` — `status <> 'pending' AND notified = false`
- `POST /api/leaves/notifications/ack` — `{ ids: [] }` → `notified = true`

**Manager** (`requireRole('manager')`)
- `GET /api/employees`
- `GET /api/leaves?status=pending`
- `PATCH /api/leaves/:id` — `{ status, manager_remarks }` (remarks mandatory)

**Shared, ownership-checked**
- `GET /api/leaves/:id/document` — manager or owning employee only

---

## Security notes (OWASP checklist)

- [x] **Passwords** bcrypt-hashed, cost ≥ 12; never logged or returned. Login runs a dummy compare on unknown usernames so timing doesn't leak account existence.
- [x] **JWT secret** read from `JWT_SECRET`; the server refuses to boot without it. No fallback literal anywhere.
- [x] **Manager routes** all chain `authenticate, requireRole('manager')`.
- [x] **Ownership** enforced in SQL (`WHERE employee_id = $1`), never by filtering a fetch-all in JS. The ack update is likewise scoped to the caller's rows.
- [x] **No client-supplied role or user id** — identity is always `req.user` from the verified token; Zod `.strict()` rejects an injected `role`/`employee_id`.
- [x] **All SQL parameterized** (`$1, $2, …`); no interpolation of user input.
- [x] **Uploads** MIME-whitelisted (PDF/PNG/JPEG), size-capped by `MAX_UPLOAD_MB`, stored as `crypto.randomUUID() + ext` — the client filename is kept only as a display label.
- [x] **Files served only** through `GET /api/leaves/:id/document` behind auth + ownership; `uploads/` is never mounted with `express.static`. Responses set `X-Content-Type-Options: nosniff`.
- [x] **CORS** locked to `CORS_ORIGIN`; never `*`.
- [x] **Helmet** enabled globally.
- [x] **Rate limiting** on login (5/15min) and register (10/hour) per IP.
- [x] **Errors** logged in full server-side; clients get `{ error }` and a generic "Internal server error" for 5xx.
- [x] **Secrets** — `.env` is gitignored; only `.env.example` placeholders are committed.

---

## Design decisions

**Why JWT?** The API is stateless and the SPA lives on a different origin from
the API, so a bearer token avoids cross-site cookie friction and lets any
future mobile client reuse the same endpoints. Expiry is short (`2h`).

**sessionStorage vs HttpOnly cookie.** The token is held in a module-scope
variable and mirrored to `sessionStorage`. `sessionStorage` dies with the tab
and isn't shared across tabs, which is better than `localStorage` — but it is
still readable by JavaScript, so an XSS bug means token theft. An HttpOnly,
`SameSite=Strict`, `Secure` cookie would be immune to XSS exfiltration at the
cost of needing CSRF protection and same-site deployment. For this scope
(single origin pair, short expiry, no third-party scripts) sessionStorage is
the pragmatic pick; the cookie approach is the correct upgrade for production
with real user data.

**Why disk storage for uploads?** At this scope a single API instance serves
the files, so local disk plus a gated streaming route is the simplest thing
that is actually secure — no public bucket, no signed-URL leakage. All file
access flows through one function (`leaves.controller.document`), so swapping
in S3/Supabase Storage later means changing `upload.js` and that one reader,
nothing else.

**Why role is never client-supplied.** Role is an authorization claim, not user
input. It is written once by `createEmployee` (hardcoded literal) or by
`seed.js`, read back only from a signature-verified JWT, and constrained by a
DB `CHECK` plus a single-manager unique index. Three independent layers must
fail before privilege escalation is possible.

**Why this schema.** `leave_requests` carries its own `status`, `reviewed_by`,
and `manager_remarks` rather than a separate approvals table — a request has
exactly one terminal decision, so a second table would add joins with no gain.
`notified` implements exactly-once toasting without a notifications table:
reviewing sets it back to `false`, the client acks it to `true`. The
`CHECK (end_date >= start_date)` and status check live in the database so bad
rows are impossible even if application code regresses.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full request lifecycle trace.
