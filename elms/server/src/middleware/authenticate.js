"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Verifies `Authorization: Bearer <token>` and attaches req.user.
 * The identity ALWAYS comes from the signed token — never from the body,
 * query string, or a custom header a client could forge.
 */
function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (!token || scheme.toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: Number(payload.sub), role: payload.role };
    if (!req.user.id || !req.user.role) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: message });
  }
}

module.exports = authenticate;
