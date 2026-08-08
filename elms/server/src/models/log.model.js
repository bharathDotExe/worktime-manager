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

module.exports = {
  recordLogin,
};
