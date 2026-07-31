"use strict";

/**
 * Role gate. Always chain AFTER authenticate:
 *   router.get("/x", authenticate, requireRole("manager"), handler)
 */
function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

module.exports = requireRole;
