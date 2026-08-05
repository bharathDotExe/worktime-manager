/**
 * Seed demo data via the running API server (http://localhost:4000/api).
 * This avoids direct DB connection issues.
 *
 * Run:  node seed-via-api.js
 */

const BASE = process.env.VITE_API_URL || "http://localhost:4000/api";

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 409) {
    throw new Error(`${res.status} ${path}: ${data.error || res.statusText}`);
  }
  return { status: res.status, data };
}

async function login(username, password) {
  const { data } = await post("/auth/login", { username, password });
  return data.token;
}

// ── Demo employees ───────────────────────────────────────────────
const EMPLOYEES = [
  { username: "karan.patel@gcu.in",   password: "karan@2706" },
  { username: "ananya.sharma@gcu.in", password: "ananya@2706" },
  { username: "rohit.kumar@gcu.in",   password: "rohit@2706" },
  { username: "priya.nair@gcu.in",    password: "priya@2706" },
  { username: "vikram.singh@gcu.in",  password: "vikram@2706" },
  { username: "meera.joshi@gcu.in",   password: "meera@2706" },
  { username: "arjun.reddy@gcu.in",   password: "arjun@2706" },
  { username: "divya.menon@gcu.in",   password: "divya@2706" },
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Leave request templates ──────────────────────────────────────
// [reason, startOffset, durationDays, status, manager_remarks]
const LEAVE_TEMPLATES = [
  ["Annual vacation with family", -30, 5, "approved", "Approved. Enjoy your vacation!"],
  ["Medical appointment - dental surgery", -20, 2, "approved", "Approved. Take care and rest well."],
  ["Sister's wedding ceremony", -15, 3, "approved", "Approved. Congratulations!"],
  ["Personal day - house shifting", -10, 1, "approved", "Approved."],
  ["Eye checkup and new glasses", -25, 1, "approved", "Approved. Health comes first."],
  ["Feeling unwell, need rest", 2, 2, "pending", null],
  ["Family function in hometown", 5, 3, "pending", null],
  ["Passport renewal appointment", 3, 1, "pending", null],
  ["Child's school annual day", 7, 1, "pending", null],
  ["Going on a trip with friends", -8, 5, "rejected", "Rejected: overlaps with sprint deadline. Please reschedule."],
  ["Need a break, feeling tired", -12, 3, "rejected", "Rejected: too many people off that week. Try next month."],
  ["Attending a tech conference", -5, 2, "rejected", "Rejected: not applicable for leave. Please apply through training budget."],
];

(async () => {
  try {
    console.log("\n🌱 Seeding demo data via API...\n");

    // 1) Login as manager to review leaves later
    console.log("Logging in as manager...");
    const managerToken = await login("manager@gcu.in", "manager@2706");
    console.log("  ✓ Manager logged in\n");

    // 2) Register employees (409 = already exists, that's fine)
    console.log("Registering employees:");
    const empTokens = {};
    for (const emp of EMPLOYEES) {
      try {
        const { status, data } = await post("/auth/register", {
          username: emp.username,
          password: emp.password,
        });
        if (status === 409) {
          console.log(`  ○ Already exists: ${emp.username}`);
          // Login instead
          empTokens[emp.username] = await login(emp.username, emp.password);
        } else {
          console.log(`  ✓ Created: ${emp.username}`);
          empTokens[emp.username] = data.token;
        }
      } catch (err) {
        console.log(`  ⚠ ${emp.username}: ${err.message}`);
        // Try logging in if registration failed for another reason
        try {
          empTokens[emp.username] = await login(emp.username, emp.password);
        } catch { /* skip */ }
      }
    }
    console.log();

    // 3) Create leave requests per employee, then review via manager
    console.log("Creating leave requests:");
    let total = 0;
    for (let i = 0; i < EMPLOYEES.length; i++) {
      const emp = EMPLOYEES[i];
      const token = empTokens[emp.username];
      if (!token) continue;

      const count = 3 + (i % 2); // 3 or 4 leaves per employee
      const startIdx = (i * 3) % LEAVE_TEMPLATES.length;

      for (let j = 0; j < count; j++) {
        const tpl = LEAVE_TEMPLATES[(startIdx + j) % LEAVE_TEMPLATES.length];
        const [reason, startOff, dur, status, remarks] = tpl;
        const offset = startOff - i * 2; // stagger dates

        try {
          // Employee creates the leave request
          const { data: leaveData } = await post(
            "/leaves",
            {
              reason,
              start_date: dateOffset(offset),
              end_date: dateOffset(offset + dur - 1),
            },
            token,
          );

          const leaveId = leaveData.leave?.id;
          const tag = { approved: "✅", pending: "⏳", rejected: "❌" }[status];
          console.log(`  ${tag} ${emp.username.split("@")[0]}: ${reason.slice(0, 45)}… (${status})`);

          // Manager reviews if not pending
          if (leaveId && status !== "pending" && remarks) {
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${managerToken}` };
            await fetch(`${BASE}/leaves/${leaveId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ status, manager_remarks: remarks }),
            });
          }
          total++;
        } catch (err) {
          console.log(`  ⚠ Failed: ${reason.slice(0, 30)}… — ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Done! Created ${total} leave requests.\n`);
    console.log("Demo credentials (password pattern: firstname@2706):");
    console.log("─".repeat(52));
    EMPLOYEES.forEach((e) =>
      console.log(`  ${e.username.padEnd(30)} ${e.password}`)
    );
    console.log("─".repeat(52));
    console.log();
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  }
})();
