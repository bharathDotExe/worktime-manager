"use strict";

const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected idle client error", err);
});

/**
 * All queries go through here. `text` must always use $1, $2 placeholders —
 * never string concatenation of user input.
 */
async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = { pool, query };
