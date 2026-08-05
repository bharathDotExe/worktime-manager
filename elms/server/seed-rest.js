"use strict";

require("dotenv").config();
const bcrypt = require("bcrypt");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

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
  ["Going on a trip with friends", -8, 5, "rejected", "Rejected: overlaps with sprint deadline."],
  ["Need a break, feeling tired", -12, 3, "rejected", "Rejected: too many people off that week."],
  ["Attending a tech conference", -5, 2, "rejected", "Rejected: not applicable. Use training budget."],
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function postRest(table, data, conflict = false) {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
  if (conflict) headers["Prefer"] = "return=representation,resolution=merge-duplicates";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 409) return null; // Conflict handling
    const err = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${err}`);
  }
  return await res.json();
}

async function getRest(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

(async () => {
  try {
    console.log("🌱 Seeding demo data via Supabase REST API...\n");

    const managers = await getRest("users", "role=eq.manager&select=id&limit=1");
    if (!managers || managers.length === 0) {
      throw new Error("Manager not found. Please run initial seed first.");
    }
    const managerId = managers[0].id;
    console.log(`Manager ID: ${managerId}`);

    const employeeIds = [];
    console.log("\nCreating employees:");
    for (const emp of EMPLOYEES) {
      const hash = await bcrypt.hash(emp.password, parseInt(process.env.BCRYPT_ROUNDS || "10", 10));
      try {
        const users = await postRest("users", {
          username: emp.username,
          password_hash: hash,
          role: "employee"
        });
        if (users && users.length > 0) {
          console.log(`  ✓ ${emp.username}`);
          employeeIds.push(users[0].id);
        } else {
          // Conflict
          const existing = await getRest("users", `username=eq.${encodeURIComponent(emp.username)}&select=id`);
          if (existing && existing.length > 0) {
            console.log(`  ○ Skipped (exists): ${emp.username}`);
            employeeIds.push(existing[0].id);
          }
        }
      } catch (err) {
        if (err.message.includes("duplicate key")) {
           const existing = await getRest("users", `username=eq.${encodeURIComponent(emp.username)}&select=id`);
           if (existing && existing.length > 0) {
             console.log(`  ○ Skipped (exists): ${emp.username}`);
             employeeIds.push(existing[0].id);
           }
        } else {
           console.log(`  ⚠ ${emp.username}: ${err.message}`);
        }
      }
    }

    console.log("\nCreating leave requests:");
    let total = 0;
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];
      const count = 3 + (i % 2); // 3-4 leaves each
      const startIdx = (i * 3) % LEAVE_TEMPLATES.length;

      for (let j = 0; j < count; j++) {
        const tpl = LEAVE_TEMPLATES[(startIdx + j) % LEAVE_TEMPLATES.length];
        const [reason, startOff, dur, status, remarks] = tpl;
        const offset = startOff - i * 2;

        try {
          const reqs = await postRest("leave_requests", {
            employee_id: empId,
            reason,
            start_date: dateOffset(offset),
            end_date: dateOffset(offset + dur - 1),
            status,
            manager_remarks: status !== "pending" ? remarks : null,
            reviewed_by: status !== "pending" ? managerId : null,
            notified: true
          });
          const tag = { approved: "✅", pending: "⏳", rejected: "❌" }[status];
          console.log(`  ${tag} ${reason.slice(0,40)}… (${status})`);
          total++;
        } catch (err) {
          console.log(`  ⚠ Failed: ${reason} — ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Done! Inserted ${total} leaves.\n`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  }
})();
