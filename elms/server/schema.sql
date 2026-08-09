-- Employee Leave Management System — schema
-- Version: 1.0.1  |  Last updated: 2026-08-09
-- Safe to run repeatedly (all statements use IF NOT EXISTS / DO blocks).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee', -- 'employee' | 'manager'
  full_name VARCHAR(255),
  department VARCHAR(100),
  profile_pic_url VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defense in depth: the DB itself enforces valid roles,
-- so even direct DB access cannot insert an unknown role.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('employee', 'manager'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS leave_requests (
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

CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- Only one manager account may ever exist.
-- Manager creation is handled exclusively by seed.js (never via the API).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_single_manager
  ON users ((role)) WHERE role = 'manager';

CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
