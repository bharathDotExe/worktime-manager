"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/user.model");
const Log = require("../models/log.model");
const { credentialsSchema, parseOrThrow } = require("../utils/validators");

function signToken(user) {
  // Payload carries only the id and role; both are re-read from the signed
  // token on every request, so a client can never claim another identity.
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register(req, res, next) {
  try {
    const { username, password } = parseOrThrow(credentialsSchema, req.body);

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const hash = await bcrypt.hash(password, env.bcryptRounds);
    // Role is NOT read from req.body — createEmployee hardcodes 'employee'.
    const user = await User.createEmployee(username, hash);

    return res.status(201).json({
      token: signToken(user),
      id: user.id,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = parseOrThrow(credentialsSchema, req.body);
    const user = await User.findByUsername(username);

    // Same generic message + a dummy compare so response timing and wording
    // don't reveal whether the username exists.
    const hash = user ? user.password_hash : "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Log the successful login attempt
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];
      await Log.recordLogin(user.id, ipAddress, userAgent);
    } catch (logErr) {
      console.error("Failed to record login log:", logErr);
      // We don't fail the login if logging fails.
    }

    return res.json({
      token: signToken(user),
      id: user.id,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    return res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me };
