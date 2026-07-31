"use strict";

const fs = require("fs");
const path = require("path");
const env = require("../config/env");
const Leave = require("../models/leaveRequest.model");
const {
  createLeaveSchema,
  reviewLeaveSchema,
  ackSchema,
  listLeavesQuerySchema,
  idParamSchema,
  parseOrThrow,
} = require("../utils/validators");

function cleanupUpload(file) {
  if (file?.path) fs.promises.unlink(file.path).catch(() => {});
}

/** Employee: create a leave request owned by the authenticated user. */
async function create(req, res, next) {
  try {
    const body = parseOrThrow(createLeaveSchema, {
      reason: req.body.reason,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
    });

    const leave = await Leave.create({
      employeeId: req.user.id, // from the JWT, never from the body
      reason: body.reason,
      startDate: body.start_date,
      endDate: body.end_date,
      documentUrl: req.file ? path.basename(req.file.path) : null,
      documentName: req.file ? req.file.originalname : null,
    });

    return res.status(201).json({ leave });
  } catch (err) {
    cleanupUpload(req.file);
    return next(err);
  }
}

/** Employee: own requests only — filtered in SQL. */
async function listMine(req, res, next) {
  try {
    const leaves = await Leave.listByEmployee(req.user.id);
    return res.json({ leaves });
  } catch (err) {
    return next(err);
  }
}

/** Manager: all requests, optionally filtered by status. */
async function listAll(req, res, next) {
  try {
    const { status } = parseOrThrow(listLeavesQuerySchema, req.query);
    const leaves = await Leave.listAll(status);
    return res.json({ leaves });
  } catch (err) {
    return next(err);
  }
}

/** Employee: unseen status changes. */
async function notifications(req, res, next) {
  try {
    const leaves = await Leave.listUnnotified(req.user.id);
    return res.json({ notifications: leaves });
  } catch (err) {
    return next(err);
  }
}

/** Employee: mark notifications seen (only own rows are updated). */
async function ackNotifications(req, res, next) {
  try {
    const { ids } = parseOrThrow(ackSchema, req.body);
    const acknowledged = await Leave.acknowledge(req.user.id, ids);
    return res.json({ acknowledged });
  } catch (err) {
    return next(err);
  }
}

/**
 * Streams the uploaded document. uploads/ is NOT served statically: this is
 * the only path to a file, and it requires manager role or ownership.
 */
async function document(req, res, next) {
  try {
    const id = parseOrThrow(idParamSchema, req.params.id);
    const leave = await Leave.findRawById(id);
    if (!leave || !leave.document_url) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = leave.employee_id === req.user.id;
    const isManager = req.user.role === "manager";
    if (!isOwner && !isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // basename() guards against any stored path traversal.
    const filePath = path.join(env.uploadDir, path.basename(leave.document_url));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(filePath);
  } catch (err) {
    return next(err);
  }
}

/** Manager: approve/reject with mandatory remarks. */
async function review(req, res, next) {
  try {
    const id = parseOrThrow(idParamSchema, req.params.id);
    const { status, manager_remarks } = parseOrThrow(reviewLeaveSchema, req.body);

    const updated = await Leave.review({
      id,
      status,
      remarks: manager_remarks,
      reviewerId: req.user.id, // from the JWT
    });

    if (!updated) {
      const existing = await Leave.findById(id);
      if (!existing) return res.status(404).json({ error: "Leave request not found" });
      return res.status(409).json({ error: "Leave request has already been reviewed" });
    }

    return res.json({ leave: updated });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  listMine,
  listAll,
  notifications,
  ackNotifications,
  document,
  review,
};
