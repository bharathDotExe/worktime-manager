"use strict";

/**
 * Seeds the ONE manager account. The manager can never be created through the
 * API — /api/auth/register always forces role='employee' — so this script is
 * the single source of manager provisioning.
 *
 * Idempotent: ON CONFLICT DO NOTHING.
 */

const bcrypt = require("bcrypt");
const env = require("./src/config/env");
const { pool } = require("./src/config/db");

async function upsertUser(username, plainPassword, role) {
  const hash = await bcrypt.hash(plainPassword, env.bcryptRounds);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING
     RETURNING id, username, role`,
    [username, hash, role],
  );
  if (rows[0]) {
    console.log(`Created ${role}: ${username}`);
  } else {
    console.log(`${role} already exists, skipped: ${username}`);
  }
}

(async () => {
  try {
    const managerUsername = process.env.MANAGER_USERNAME || "manager@gcu.in";
    const managerPassword = process.env.MANAGER_SEED_PASSWORD;
    if (!managerPassword) {
      throw new Error("MANAGER_SEED_PASSWORD is required to seed the manager account");
    }
    await upsertUser(managerUsername, managerPassword, "manager");

    // Optional demo employee, only if configured.
    const demoUser = process.env.DEMO_EMPLOYEE_USERNAME;
    const demoPass = process.env.DEMO_EMPLOYEE_PASSWORD;
    if (demoUser && demoPass) {
      await upsertUser(demoUser, demoPass, "employee");
    }
    console.log("Seed complete.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
