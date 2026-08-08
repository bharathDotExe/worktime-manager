"use strict";

const { query } = require("../config/db");

async function recordLogin(userId, ipAddress = null, userAgent = null) {
  const { rows } = await query(
    `INSERT INTO login_logs (user_id, ip_address, user_agent)
     VALUES ($1, $2, $3)
     RETURNING id, login_time`,
    [userId, ipAddress, userAgent],
  );
  return rows[0];
}

async function getLogs(limit = 50) {
  const { rows } = await query(
    `SELECT l.id, l.user_id, l.ip_address, l.user_agent, l.login_time, 
            u.username, u.full_name, u.profile_pic_url, u.role
     FROM login_logs l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.login_time DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = {
  recordLogin,
  getLogs,
};
