"use strict";

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

(async () => {
  const sql = fs.readFileSync(path.resolve(__dirname, "../schema.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("Schema applied.");
  } catch (err) {
    console.error("Failed to apply schema:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
