"use strict";

const User = require("../models/user.model");
const Log = require("../models/log.model");

/** Manager-only: list employee accounts. Password hashes are never selected. */
async function list(req, res, next) {
  try {
    const employees = await User.listEmployees();
    return res.json({ employees });
  } catch (err) {
    return next(err);
  }
}

/** Manager-only: list recent login logs. */
async function listLogs(req, res, next) {
  try {
    const logs = await Log.getLogs(100);
    return res.json({ logs });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, listLogs };
