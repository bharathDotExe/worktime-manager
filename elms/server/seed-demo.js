"use strict";

/**
 * Seed script to populate the database with demo employees and leave requests.
 * Idempotent: uses ON CONFLICT DO NOTHING for users.
 *
 * Run:  node seed-demo.js
 */

const bcrypt = require("bcrypt");
const env = require("./src/config/env");
const { pool } = require("./src/config/db");

// ── Demo employees ───────────────────────────────────────────────
const EMPLOYEES = [
  { username: "karan.patel@gcu.in",    password: "karan@2706" },
  { username: "ananya.sharma@gcu.in",  password: "ananya@2706" },
  { username: "rohit.kumar@gcu.in",    password: "rohit@2706" },
  { username: "priya.nair@gcu.in",     password: "priya@2706" },
  { username: "vikram.singh@gcu.in",   password: "vikram@2706" },
  { username: "meera.joshi@gcu.in",    password: "meera@2706" },
  { username: "arjun.reddy@gcu.in",    password: "arjun@2706" },
  { username: "divya.menon@gcu.in",    password: "divya@2706" },
];

// ── Leave request templates ──────────────────────────────────────
// Each entry: [reason, daysFromNow (start), durationDays, status, manager_remarks]
const LEAVE_TEMPLATES = [
  // Approved leaves
  ["Annual vacation with family", -30, 5, "approved", "Approved. Enjoy your vacation!"],
  ["Medical appointment - dental surgery", -20, 2, "approved", "Approved. Take care and rest well."],
  ["Sister's wedding ceremony", -15, 3, "approved", "Approved. Congratulations!"],
  ["Personal day - house shifting", -10, 1, "approved", "Approved."],
  ["Eye checkup and new glasses", -25, 1, "approved", "Approved. Health comes first."],

  // Pending leaves
  ["Feeling unwell, need rest", 2, 2, "pending", null],
  ["Family function in hometown", 5, 3, "pending", null],
  ["Passport renewal appointment", 3, 1, "pending", null],
  ["Child's school annual day", 7, 1, "pending", null],

  // Rejected leaves
  ["Going on a trip with friends", -8, 5, "rejected", "Rejected: overlaps with sprint deadline. Please reschedule."],
  ["Need a break, feeling tired", -12, 3, "rejected", "Rejected: too many people off that week. Try next month."],
  ["Attending a tech conference", -5, 2, "rejected", "Rejected: not applicable. Please apply through training budget."],
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function createEmployee(username, plainPassword) {
  const hash = await bcrypt.hash(plainPassword, env.bcryptRounds);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, 'employee')
     ON CONFLICT (username) DO NOTHING
     RETURNING id, username`,
    [username, hash],
  );
  if (rows[0]) {
    console.log(`  ✓ Created employee: ${username}`);
    return rows[0].id;
  }
  // Already exists — fetch the id
  const existing = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
  console.log(`  ○ Already exists, skipped: ${username}`);
  return existing.rows[0]?.id;
}

async function getManagerId() {
  const { rows } = await pool.query(`SELECT id FROM users WHERE role = 'manager' LIMIT 1`);
  return rows[0]?.id || null;
}

async function createLeaveRequest(employeeId, managerId, template) {
  const [reason, startOffset, duration, status, remarks] = template;
  const startDate = dateOffset(startOffset);
  const endDate = dateOffset(startOffset + duration - 1);

  const { rows } = await pool.query(
    `INSERT INTO leave_requests
       (employee_id, reason, start_date, end_date, status, manager_remarks, reviewed_by, notified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id`,
    [
      employeeId,
      reason,
      startDate,
      endDate,
      status,
      remarks,
      status !== "pending" ? managerId : null,
    ],
  );
  const tag = { approved: "✅", pending: "⏳", rejected: "❌" }[status];
  console.log(`    ${tag} Leave #${rows[0].id}: ${reason.slice(0, 40)}… (${status})`);
}

(async () => {
  try {
    console.log("\n🌱 Seeding demo data...\n");

    // 1) Get the manager (must exist from seed.js)
    const managerId = await getManagerId();
    if (!managerId) {
      throw new Error("No manager found. Run `npm run seed` first to create the manager account.");
    }
    console.log(`Manager account found (id=${managerId})\n`);

    // 2) Create employees
    console.log("Creating employees:");
    const employeeIds = [];
    for (const emp of EMPLOYEES) {
      const id = await createEmployee(emp.username, emp.password);
      if (id) employeeIds.push(id);
    }
    console.log(`\n${employeeIds.length} employee accounts ready.\n`);

    // 3) Create leave requests — distribute templates across employees
    console.log("Creating leave requests:");
    let leaveCount = 0;
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];
      // Each employee gets 3-4 leave requests (cycle through templates)
      const startIdx = (i * 3) % LEAVE_TEMPLATES.length;
      const count = 3 + (i % 2); // alternate 3 and 4
      for (let j = 0; j < count; j++) {
        const templateIdx = (startIdx + j) % LEAVE_TEMPLATES.length;
        // Add a small day offset per employee so dates don't all overlap
        const template = [...LEAVE_TEMPLATES[templateIdx]];
        template[1] = template[1] - i * 2; // shift dates slightly per employee
        await createLeaveRequest(empId, managerId, template);
        leaveCount++;
      }
    }

    console.log(`\n✅ Seed complete! Created ${leaveCount} leave requests across ${employeeIds.length} employees.\n`);
    console.log("Demo credentials (all passwords follow the pattern: firstname@2706):");
    console.log("─".repeat(50));
    EMPLOYEES.forEach((e) => console.log(`  ${e.username.padEnd(28)} ${e.password}`));
    console.log("─".repeat(50));
    console.log();
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
