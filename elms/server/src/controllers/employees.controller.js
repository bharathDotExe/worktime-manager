"use strict";

const User = require("../models/user.model");

/** Manager-only: list employee accounts. Password hashes are never selected. */
async function list(req, res, next) {
  try {
    const employees = await User.listEmployees();
    return res.json({ employees });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };
