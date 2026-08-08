"use strict";

const { query } = require("../config/db");

async function findByUsername(username) {
  const { rows } = await query(
    `SELECT id, username, password_hash, role FROM users WHERE username = $1`,
    [username],
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT id, username, full_name, department, role, created_at FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

/**
 * Creates an EMPLOYEE. The role is hardcoded here on purpose — no caller can
 * pass a role, so the API can never mint a manager.
 */
async function createEmployee(username, passwordHash, fullName = null, department = null) {
  const { rows } = await query(
    `INSERT INTO users (username, password_hash, role, full_name, department)
     VALUES ($1, $2, 'employee', $3, $4)
     RETURNING id, username, full_name, department, role, created_at`,
    [username, passwordHash, fullName, department],
  );
  return rows[0];
}

async function listEmployees() {
  const { rows } = await query(
    `SELECT u.id,
            u.username,
            u.full_name,
            u.department,
            u.created_at,
            COUNT(l.id)::int AS total_requests,
            COUNT(l.id) FILTER (WHERE l.status = 'pending')::int AS pending_requests
       FROM users u
       LEFT JOIN leave_requests l ON l.employee_id = u.id
      WHERE u.role = 'employee'
      GROUP BY u.id
      ORDER BY u.created_at DESC`,
  );
  return rows;
}

module.exports = { findByUsername, findById, createEmployee, listEmployees };
