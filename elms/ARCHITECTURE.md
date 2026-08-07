# Architecture — One Request End-to-End

## Scenario: a manager approves leave request #42

### 1. Browser

The manager clicks **Review** on `/manager/requests`, picks *approved*, types
remarks, and confirms. `LeaveRequests.jsx` calls:

```js
api.patch("/leaves/42", { status: "approved", manager_remarks: "Approved." })
```

The axios request interceptor (`src/api/client.js`) reads the in-memory token
and attaches `Authorization: Bearer <jwt>`. The modal's confirm button is
disabled while the promise is in flight.

`ProtectedRoute role="manager"` already prevented a non-manager from seeing
this screen — but that is UX only. Nothing below trusts it.

### 2. Express pipeline (`src/app.js`)

`helmet()` sets security headers → `cors()` validates the request origin
against `CORS_ORIGIN` exactly (a request from any other origin is rejected by
the browser's preflight) → `express.json({ limit: '100kb' })` parses the body.

The router match is `PATCH /api/leaves/:id` in `leaves.routes.js`.

### 3. `authenticate`

Splits the `Authorization` header, calls `jwt.verify(token, JWT_SECRET)`.
- Missing/malformed header → `401 Authentication required`
- Bad signature → `401 Invalid token`
- Past `exp` → `401 Token expired`

On success it sets `req.user = { id: Number(payload.sub), role: payload.role }`.
This is the *only* place identity enters the request; nothing later reads a
user id or role from the body, query, or headers.

### 4. `requireRole('manager')`

`req.user.role !== 'manager'` → `403 Forbidden`. An employee's token — even a
perfectly valid one — stops here. This is asserted by a test.

### 5. Controller validation (`leaves.controller.review`)

- `idParamSchema` coerces `:id` to a positive integer (`"42abc"` → 400).
- `reviewLeaveSchema` is `.strict()`: `status` must be exactly `approved` or
  `rejected`, `manager_remarks` must be 3–1000 characters after trimming, and
  any extra field (say `reviewed_by: 1` or `employee_id: 7`) causes a 400
  rather than being silently ignored.

Mandatory remarks are therefore a server rule, not a form rule.

### 6. Model (`leaveRequest.model.review`)

One parameterized statement:

```sql
UPDATE leave_requests
   SET status = $2, manager_remarks = $3, reviewed_by = $4,
       notified = false, updated_at = now()
 WHERE id = $1 AND status = 'pending'
RETURNING id
```

Three things matter here:
- `reviewed_by = $4` is `req.user.id` from the JWT.
- `AND status = 'pending'` makes the transition atomic — two concurrent
  approvals cannot both win, and re-reviewing a decided request returns zero
  rows.
- `notified = false` re-arms the employee's toast.

Zero rows → the controller distinguishes `404 Leave request not found` from
`409 Leave request has already been reviewed`.

### 7. Response

The controller re-selects the row through `BASE_SELECT`, which joins
`users` for `employee_username` and exposes `has_document` as a boolean —
`document_url` (the on-disk filename) is never sent to any client.

`200 { leave: { … } }`.

Any thrown error would instead reach `errorHandler`, which logs the full stack
server-side and returns `{ error }` — collapsing anything 5xx into a generic
`Internal server error` so stack traces, SQL text, and file paths never leak.

### 8. Back in the browser

The modal closes, a toast confirms, and the table reloads with the current
filter.

### 9. The employee's toast

Within 30 seconds (interval poll) or on their next login, the employee's SPA
calls `GET /api/leaves/notifications`, which runs
`WHERE employee_id = $1 AND status <> 'pending' AND notified = false`. Request
#42 comes back, one toast renders, and the client immediately POSTs
`/leaves/notifications/ack` with `{ ids: [42] }`. That update is also scoped
to `employee_id = $1`, so a malicious client cannot ack someone else's rows.
On refresh, `notified = true` and the toast never reappears.

---

## Document download, briefly

`GET /api/leaves/:id/document` is the only way to reach a file. It runs
`authenticate`, loads the row, and allows the read if the caller is the
manager **or** `leave.employee_id === req.user.id` — otherwise 403. The path
is rebuilt as `path.join(UPLOAD_DIR, path.basename(stored_name))`, so even a
corrupted `document_url` cannot escape the upload directory. `uploads/` is
never mounted with `express.static`, and stored names are random UUIDs, so
the filenames are not guessable even if the directory were exposed.
