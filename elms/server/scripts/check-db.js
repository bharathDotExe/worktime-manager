"use strict";

/**
 * Verifies the DATABASE_URL in server/.env actually reaches your Supabase
 * Postgres, and reports whether the ELMS tables exist yet.
 *
 * Usage: npm run db:check   (from elms/server)
 */

const { pool } = require("../src/config/db");

(async () => {
  try {
    const { rows } = await pool.query(
      "select current_database() as db, current_user as usr, version() as version",
    );
    console.log(`Connected to "${rows[0].db}" as "${rows[0].usr}"`);
    console.log(rows[0].version.split(",")[0]);

    const { rows: tables } = await pool.query(
      `select table_name
         from information_schema.tables
        where table_schema = 'public'
          and table_name in ('users','leave_requests')
        order by table_name`,
    );
    const found = tables.map((t) => t.table_name);
    for (const name of ["leave_requests", "users"]) {
      console.log(`${found.includes(name) ? "OK  " : "MISS"} public.${name}`);
    }
    if (found.length < 2) {
      console.log('\nRun "npm run schema" to create the missing tables.');
    } else {
      const { rows: counts } = await pool.query(
        `select
           (select count(*) from users where role = 'manager')::int as managers,
           (select count(*) from users where role = 'employee')::int as employees,
           (select count(*) from leave_requests)::int as leaves`,
      );
      console.log(
        `\nmanagers=${counts[0].managers} employees=${counts[0].employees} leave_requests=${counts[0].leaves}`,
      );
      if (counts[0].managers === 0) console.log('No manager yet — run "npm run seed".');
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
    console.error(
      "\nChecks:\n" +
        "  - DATABASE_URL uses the Supabase 'Connection string > URI' value\n" +
        "  - the [YOUR-PASSWORD] placeholder is replaced (URL-encode special chars)\n" +
        "  - PGSSL=true for Supabase\n" +
        "  - if IPv6 is unavailable on your network, use the Session Pooler URI (port 5432/6543)",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
