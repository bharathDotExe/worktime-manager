-- ELMS — extended schema (v2). Additive and idempotent.
-- Run after schema.sql:  psql "$DATABASE_URL" -f migrations/002_extended_schema.sql
--
-- Everything here is optional for the core apply/approve flow, but it is what
-- turns a demo into something a real HR team could run: typed leave, per-year
-- balances, an approval audit trail, working-day awareness and soft deletes.

------------------------------------------------------------------------------
-- 1. Departments  (an employee belongs to at most one)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name     VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_on     DATE;

-- Case-insensitive uniqueness: 'Alice' and 'alice' must not be two accounts.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_username_ci ON users (lower(username));

------------------------------------------------------------------------------
-- 2. Leave types  (annual / sick / unpaid / …)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_types (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(30) UNIQUE NOT NULL,
  label           VARCHAR(100) NOT NULL,
  default_days    NUMERIC(5,1) NOT NULL DEFAULT 0,
  requires_document BOOLEAN NOT NULL DEFAULT false,
  is_paid         BOOLEAN NOT NULL DEFAULT true,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO leave_types (code, label, default_days, requires_document, is_paid)
VALUES
  ('annual', 'Annual leave',    18, false, true),
  ('sick',   'Sick leave',      12, true,  true),
  ('casual', 'Casual leave',     6, false, true),
  ('unpaid', 'Unpaid leave',     0, false, false)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS leave_type_id INTEGER REFERENCES leave_types(id);

------------------------------------------------------------------------------
-- 3. Per-employee, per-year balances (the ledger the manager decides against)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_balances (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year          SMALLINT NOT NULL,
  entitled_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days     NUMERIC(5,1) NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type_id, year),
  CHECK (used_days >= 0),
  CHECK (used_days <= entitled_days + 999) -- guard rail; unpaid can exceed 0
);

CREATE INDEX IF NOT EXISTS idx_balances_employee_year
  ON leave_balances(employee_id, year);

------------------------------------------------------------------------------
-- 4. Company holidays + a working-day helper
--    Weekend/holiday days should not burn a balance.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
  id    SERIAL PRIMARY KEY,
  day   DATE UNIQUE NOT NULL,
  label VARCHAR(120) NOT NULL
);

CREATE OR REPLACE FUNCTION working_days(p_start DATE, p_end DATE)
RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::int
    FROM generate_series(p_start, p_end, interval '1 day') AS d(day)
   WHERE EXTRACT(ISODOW FROM d.day) < 6
     AND NOT EXISTS (SELECT 1 FROM holidays h WHERE h.day = d.day::date);
$$;

------------------------------------------------------------------------------
-- 5. No overlapping leave for the same employee (enforced by the DB)
------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leave_no_overlap') THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT leave_no_overlap
      EXCLUDE USING gist (
        employee_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      ) WHERE (status IN ('pending', 'approved'));
  END IF;
END $$;

------------------------------------------------------------------------------
-- 6. Audit log — who did what, immutable append-only history
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(60) NOT NULL,          -- 'leave.create' | 'leave.review' | 'auth.login' …
  entity_type VARCHAR(40) NOT NULL,          -- 'leave_request' | 'user'
  entity_id   INTEGER,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_logs(actor_id, created_at DESC);

------------------------------------------------------------------------------
-- 7. Refresh-token sessions (enables short access tokens + real logout)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,               -- sha256 of the refresh token, never the token
  user_agent    TEXT,
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;

------------------------------------------------------------------------------
-- 8. updated_at trigger (stop trusting application code to set it)
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_leave_updated_at ON leave_requests;
CREATE TRIGGER trg_leave_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------------
-- 9. Reporting view used by the manager dashboard
------------------------------------------------------------------------------
CREATE OR REPLACE VIEW leave_requests_expanded AS
  SELECT l.*,
         u.username        AS employee_username,
         u.full_name       AS employee_full_name,
         d.name            AS department,
         t.code            AS leave_type_code,
         t.label           AS leave_type_label,
         working_days(l.start_date, l.end_date) AS working_days
    FROM leave_requests l
    JOIN users u        ON u.id = l.employee_id
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN leave_types t ON t.id = l.leave_type_id;
