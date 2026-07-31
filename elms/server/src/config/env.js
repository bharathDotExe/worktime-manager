"use strict";

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  databaseUrl: required("DATABASE_URL"),
  pgSsl: (process.env.PGSSL || "true").toLowerCase() !== "false",
  // Never hardcode a fallback secret: a missing secret must crash at boot.
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  bcryptRounds: Math.max(12, Number(process.env.BCRYPT_ROUNDS || 12)),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),
  uploadDir: path.resolve(__dirname, "../../", process.env.UPLOAD_DIR || "uploads"),
};

module.exports = env;
