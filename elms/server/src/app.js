"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const leaveRoutes = require("./routes/leaves.routes");
const employeeRoutes = require("./routes/employees.routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// Correct client IPs behind a proxy so rate limiting works.
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Exact origin only — never "*".
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/employees", employeeRoutes);

// NOTE: uploads/ is deliberately NOT mounted with express.static.

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
