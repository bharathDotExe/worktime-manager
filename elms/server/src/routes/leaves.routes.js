"use strict";

const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const { upload } = require("../middleware/upload");
const controller = require("../controllers/leaves.controller");

const router = express.Router();

// Every route below is authenticated; role gates are explicit per route.
router.use(authenticate);

// --- Employee ---
router.post("/", requireRole("employee"), upload.single("document"), controller.create);
router.get("/mine", requireRole("employee"), controller.listMine);
router.get("/notifications", requireRole("employee"), controller.notifications);
router.post("/notifications/ack", requireRole("employee"), controller.ackNotifications);

// --- Shared (manager OR owning employee, checked inside the controller) ---
router.get("/:id/document", controller.document);

// --- Manager ---
router.get("/", requireRole("manager"), controller.listAll);
router.patch("/:id", requireRole("manager"), controller.review);

module.exports = router;
