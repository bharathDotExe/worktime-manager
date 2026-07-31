"use strict";

/**
 * End-to-end API tests. Requires a reachable test database (DATABASE_URL)
 * with schema.sql applied and seed.js run.
 *
 * Covers:
 *  - register -> login -> apply leave -> manager approves
 *  - employee token gets 403 on a manager-only route
 *  - unauthenticated request to a protected route gets 401
 */

const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/config/db");

const unique = `test_${Date.now()}@gcu.in`;
const password = "TestPassw0rd!";
const managerUsername = process.env.MANAGER_USERNAME || "manager@gcu.in";
const managerPassword = process.env.MANAGER_SEED_PASSWORD;

let employeeToken;
let managerToken;
let leaveId;

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE username = $1`, [unique]);
  await pool.end();
});

describe("auth", () => {
  it("registers an employee (role is forced server-side)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: unique, password });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("employee");
    expect(res.body.token).toBeTruthy();
  });

  it("ignores an attempt to self-assign the manager role", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `x_${unique}`, password, role: "manager" });

    // .strict() Zod schema rejects the extra field outright.
    expect(res.status).toBe(400);
  });

  it("logs in and returns a token", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: unique, password });
    expect(res.status).toBe(200);
    employeeToken = res.body.token;
    expect(employeeToken).toBeTruthy();
  });

  it("returns a generic error for a bad password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: unique, password: "WrongPassw0rd!" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid username or password");
  });
});

describe("authorization", () => {
  it("rejects an unauthenticated request to a protected route with 401", async () => {
    const res = await request(app).get("/api/leaves/mine");
    expect(res.status).toBe(401);
  });

  it("rejects an employee token on a manager-only route with 403", async () => {
    const res = await request(app)
      .get("/api/employees")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });
});

describe("leave lifecycle", () => {
  it("creates a leave request", async () => {
    const res = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${employeeToken}`)
      .field("reason", "Medical appointment follow-up")
      .field("start_date", "2030-01-10")
      .field("end_date", "2030-01-12");

    expect(res.status).toBe(201);
    leaveId = res.body.leave.id;
    expect(res.body.leave.status).toBe("pending");
  });

  it("lists only the caller's own requests", async () => {
    const res = await request(app)
      .get("/api/leaves/mine")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.leaves.every((l) => l.employee_username === unique)).toBe(true);
  });

  it("lets the manager approve with remarks", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: managerUsername, password: managerPassword });
    expect(login.status).toBe(200);
    managerToken = login.body.token;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "approved", manager_remarks: "Approved. Get well soon." });

    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe("approved");
    expect(res.body.leave.notified).toBe(false);
  });

  it("requires remarks when reviewing", async () => {
    const res = await request(app)
      .patch(`/api/leaves/${leaveId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
  });

  it("surfaces and acknowledges the notification exactly once", async () => {
    const first = await request(app)
      .get("/api/leaves/notifications")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(first.status).toBe(200);
    const ids = first.body.notifications.map((n) => n.id);
    expect(ids).toContain(leaveId);

    await request(app)
      .post("/api/leaves/notifications/ack")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ ids });

    const second = await request(app)
      .get("/api/leaves/notifications")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(second.body.notifications.map((n) => n.id)).not.toContain(leaveId);
  });
});
