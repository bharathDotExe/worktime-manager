# WorkTime Manager

You are an expert full-stack engineer. Build a complete, production-quality **Employee Leave Management System (ELMS)** using **React (Vite) + Node.js/Express + PostgreSQL (Supabase) + JWT**. Prioritize backend correctness and security over frontend polish, but deliver a clean, usable UI as well.

### 1. Project overview

Two user roles:
- **Employee**: registers, logs in, applies for leave with a supporting file, views their own leave history and status, gets a one-time toast when a request is approved/rejected.
- **Manager**: a single, fixed, pre-seeded account (never creatable via the UI or API). Logs in, views all employees, views all leave requests, opens uploaded documents, and approves/rejects requests with mandatory remarks.

Non-negotiable principle: **every rule must be enforced on the backend**, not just hidden in the frontend UI. Assume the frontend can be bypassed entirely (e.g., via curl/Postman) and design accordingly.

### 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, React Router, Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Supabase-compatible connection string) |
| Auth | JWT (access token) + bcrypt (cost factor 12) |
| File upload | Multer, disk storage (swappable for object storage later) |
| Validation | Zod |
| Security middleware | helmet, cors, express-rate-limit |

### 3. Repository structure

Create a monorepo with two apps:

```
elms/
  server/
    src/
      config/          # db pool, env loading
      middleware/       # authenticate.js, requireRole.js, errorHandler.js, upload.js
      routes/           # auth.routes.js, leaves.routes.js, employees.routes.js
      controllers/      # auth.controller.js, leaves.controller.js, employees.controller.js
      models/           # user.model.js, leaveRequest.model.js
      utils/            # validators.js
      app.js
      server.js
    uploads/             # gitignored
    seed.js
    schema.sql
    .env.example
    package.json
  client/
    src/
      api/               # axios instance + interceptors
      context/           # AuthContext.jsx
      components/        # ProtectedRoute.jsx, Toast.jsx, StatusBadge.jsx
      pages/
        Login.jsx
        Register.jsx
        employee/Dashboard.jsx
        employee/ApplyLeave.jsx
        employee/LeaveHistory.jsx
        manager/Employees.jsx
        manager/LeaveRequests.jsx
      App.jsx
      main.jsx
    package.json
  README.md
```

### 4. Database schema

Implement exactly this schema (adjust only if a genuine bug is found):

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee', -- 'employee' | 'manager'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  document_url TEXT,
  document_name TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  manager_remarks TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  CHECK (end_date >= start_date),
  CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
```

Write a `seed.js` that inserts exactly one manager row (`manager@gcu.in`) with a bcrypt-hashed password read from `process.env.MANAGER_SEED_PASSWORD`. This must be idempotent (`ON CONFLICT DO NOTHING`) and must never be exposed via any public API route.

### 5. API contract

Implement exactly these routes:

**Auth**
- `POST /api/auth/register` (public) — `{ username, password }` → always creates `role: 'employee'` server-side; never reads role from the body.
- `POST /api/auth/login` (public) — `{ username, password }` → `{ token, role, username }`. Return a generic "Invalid username or password" error for both bad username and bad password.
- `GET /api/auth/me` (bearer) → `{ id, username, role }`

**Employee** (role = employee)
- `POST /api/leaves` — multipart form: `reason, start_date, end_date, document` → creates a leave request owned by the authenticated user.
- `GET /api/leaves/mine` — returns only the caller's own requests (filter in SQL by `employee_id`, never fetch-all-then-filter in JS).
- `GET /api/leaves/notifications` — unseen status changes (`status != 'pending' AND notified = false`).
- `POST /api/leaves/notifications/ack` — `{ ids: [...] }` → sets `notified = true`.

**Manager** (role = manager)
- `GET /api/employees` — list of employee accounts.
- `GET /api/leaves?status=pending` — all leave requests, optionally filtered, joined with employee username.
- `GET /api/leaves/:id/document` — streams the file, but only if the caller is the manager or the owning employee.
- `PATCH /api/leaves/:id` — `{ status: 'approved' | 'rejected', manager_remarks }` → updates the row, sets `reviewed_by`, and resets `notified = false` so the toast fires again.

### 6. Authentication & authorization requirements

- Passwords hashed with bcrypt, cost factor ≥ 12. Never log or return plaintext passwords.
- JWT signed with `process.env.JWT_SECRET`, payload `{ sub: user.id, role }`, expiry from `JWT_EXPIRES_IN` (default `2h`).
- `authenticate` middleware: verifies the `Authorization: Bearer <token>` header, attaches `req.user`, returns 401 on missing/invalid/expired token.
- `requireRole(role)` middleware: returns 403 if `req.user.role !== role`. Chain as `authenticate, requireRole('manager')`.
- No endpoint may accept a client-supplied `role` or `user id` for any privileged action — always derive from the verified JWT.
- No endpoint may create or promote a manager account. The only manager row comes from `seed.js`.
- Rate-limit `POST /api/auth/login` (e.g., 5 attempts / 15 min per IP).

### 7. File upload requirements

- Use Multer with disk storage.
- Whitelist MIME types: `application/pdf`, `image/png`, `image/jpeg`.
- Cap size via `MAX_UPLOAD_MB` env var (default 5MB).
- Generate the stored filename with `crypto.randomUUID()` + original extension — **never** trust or reuse the client-supplied filename.
- Never serve `uploads/` as a static/public folder. Serve files only through `GET /api/leaves/:id/document`, gated by ownership/role check as described above.

### 8. Notifications

- On login (and optionally on an interval while the SPA is open), fetch `GET /api/leaves/notifications`.
- Render one toast per unseen status change, then immediately call `POST /api/leaves/notifications/ack` with those IDs so the toast never reappears on refresh.

### 9. Security middleware (apply globally in `app.js`)

- `helmet()`
- `cors({ origin: process.env.CORS_ORIGIN, credentials: true })` — never `origin: '*'`.
- Central `errorHandler` middleware that logs full errors server-side but returns only `{ error: message }` to the client, with generic "Internal server error" on 5xx.
- All SQL via parameterized queries (`$1, $2, ...`) — no string concatenation.
- All request bodies validated with Zod schemas; reject unexpected extra fields.

### 10. Frontend requirements

- `AuthContext` holds `{ user, token }`; token stored in memory + `sessionStorage` (not `localStorage`).
- Axios instance attaches `Authorization: Bearer <token>` via request interceptor; a response interceptor logs the user out on 401.
- `ProtectedRoute` component blocks by login state and role — but note in a code comment that this is UX only; real enforcement is server-side.
- Pages: Login, Register, Employee Dashboard (with Apply Leave + View History buttons), Apply Leave form (with file input, client-side validation, disabled submit while in-flight), Leave History (sorted newest-first, `StatusBadge` component with color per status, manager remarks shown only when present), Manager Employees table, Manager Leave Requests table (filterable by status, approve/reject via a modal that requires remarks before confirming).
- Every async action shows a loading and success/error state — no silent failures.
- One consistent accent color and font family across all pages via Tailwind.

### 11. Deliverables

1. Full working source code for `server/` and `client/`, organized per the structure above.
2. `schema.sql` and `seed.js`.
3. `.env.example` for both apps (never commit real secrets).
4. A root `README.md` with: overview, tech stack, architecture diagram (text is fine), setup instructions (clone → env → install → schema → seed → run), sample credentials section (manager + one seeded demo employee), a security notes section summarizing the OWASP checklist below, and short design-decision explanations (why JWT, why this upload approach, why this schema).
5. A short `ARCHITECTURE.md` (or README section) tracing one end-to-end request lifecycle, e.g. "what happens when a manager approves a request."
6. A minimal automated test suite (Jest/Supertest) covering: register → login → apply leave → approve, plus one negative test proving an employee token gets 403 on a manager-only route, and one test proving an unauthenticated request to a protected route gets 401.

### 12. Security self-check (must pass before considering this done)

- [ ] Passwords hashed with bcrypt, never plaintext
- [ ] JWT secret is a long random value from env, not hardcoded
- [ ] Every manager route protected by `authenticate` + `requireRole('manager')`
- [ ] Employees can only see/act on their own leave requests (filtered in SQL)
- [ ] No endpoint lets a client set its own role or user id
- [ ] All SQL parameterized
- [ ] Uploads type-checked, size-capped, randomly named on disk
- [ ] Uploaded files served only via an authenticated, ownership-checked route
- [ ] CORS restricted to the exact frontend origin
- [ ] Helmet enabled
- [ ] Login endpoint rate-limited
- [ ] `.env` gitignored; `.env.example` committed with placeholders only

### 13. Style and explanation expectations

- Small, well-named files over one giant `app.js`.
- Meaningful commit messages if using git (`feat: add JWT auth middleware`, not `update`).
- Be ready to explain, in the code comments or README, why disk storage was chosen for this scope, why role is never client-supplied, and the tradeoff between `sessionStorage` and an HttpOnly cookie for the JWT.

Build this now, starting with the database schema and backend auth/RBAC (the highest-scrutiny parts), then leave requests + uploads, then the manager flow, then the frontend, then security hardening and tests.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/842c34d4-8ed9-477b-8829-ed6555e3a9e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
