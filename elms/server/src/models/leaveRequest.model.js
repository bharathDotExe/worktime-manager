"use strict";

const { query } = require("../config/db");

const BASE_SELECT = `
  SELECT l.id, l.employee_id, u.username AS employee_username,
         l.reason, l.start_date, l.end_date,
         l.document_name, (l.document_url IS NOT NULL) AS has_document,
         l.status, l.manager_remarks, l.reviewed_by,
         l.created_at, l.updated_at, l.notified
    FROM leave_requests l
    JOIN users u ON u.id = l.employee_id
`;

async function create({ employeeId, reason, startDate, endDate, documentUrl, documentName }) {
  const { rows } = await query(
    `INSERT INTO leave_requests
       (employee_id, reason, start_date, end_date, document_url, document_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [employeeId, reason, startDate, endDate, documentUrl, documentName],
  );
  return findById(rows[0].id);
}

async function findById(id) {
  const { rows } = await query(`${BASE_SELECT} WHERE l.id = $1`, [id]);
  return rows[0] || null;
}

/** Raw row incl. document_url — used only by the gated download route. */
async function findRawById(id) {
  const { rows } = await query(`SELECT * FROM leave_requests WHERE id = $1`, [id]);
  return rows[0] || null;
}

/** Ownership is enforced in SQL, not by filtering a fetch-all in JS. */
async function listByEmployee(employeeId) {
  const { rows } = await query(
    `${BASE_SELECT} WHERE l.employee_id = $1 ORDER BY l.created_at DESC`,
    [employeeId],
  );
  return rows;
}

async function listAll(status) {
  if (status) {
    const { rows } = await query(
      `${BASE_SELECT} WHERE l.status = $1 ORDER BY l.created_at DESC`,
      [status],
    );
    return rows;
  }
  const { rows } = await query(`${BASE_SELECT} ORDER BY l.created_at DESC`);
  return rows;
}

async function listUnnotified(employeeId) {
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE l.employee_id = $1 AND l.status <> 'pending' AND l.notified = false
      ORDER BY l.updated_at DESC`,
    [employeeId],
  );
  return rows;
}

/** Only marks rows the caller owns. */
async function acknowledge(employeeId, ids) {
  const { rows } = await query(
    `UPDATE leave_requests
        SET notified = true
      WHERE employee_id = $1 AND id = ANY($2::int[])
      RETURNING id`,
    [employeeId, ids],
  );
  return rows.map((r) => r.id);
}

/** Only a pending request can be reviewed; notified resets so the toast fires. */
async function review({ id, status, remarks, reviewerId }) {
  const { rows } = await query(
    `UPDATE leave_requests
        SET status = $2,
            manager_remarks = $3,
            reviewed_by = $4,
            notified = false,
            updated_at = now()
      WHERE id = $1 AND status = 'pending'
      RETURNING id`,
    [id, status, remarks, reviewerId],
  );
  if (!rows[0]) return null;
  return findById(id);
}

module.exports = {
  create,
  findById,
  findRawById,
  listByEmployee,
  listAll,
  listUnnotified,
  acknowledge,
  review,
};
