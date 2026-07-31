"use strict";

const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/employees.controller");

const router = express.Router();

router.get("/", authenticate, requireRole("manager"), controller.list);

module.exports = router;
