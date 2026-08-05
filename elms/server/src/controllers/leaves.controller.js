"use strict";

const fs = require("fs");
const path = require("path");
const env = require("../config/env");
const Leave = require("../models/leaveRequest.model");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = env.supabaseUrl && env.supabaseKey 
  ? createClient(env.supabaseUrl, env.supabaseKey)
  : null;
const {
  createLeaveSchema,
  reviewLeaveSchema,
  ackSchema,
  listLeavesQuerySchema,
  idParamSchema,
  parseOrThrow,
} = require("../utils/validators");

/** Employee: create a leave request owned by the authenticated user. */
async function create(req, res, next) {
  try {
    const body = parseOrThrow(createLeaveSchema, {
      reason: req.body.reason,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
    });

    let documentUrl = null;
    let documentName = null;

    if (req.file) {
      if (!supabase) throw new Error("Supabase is not configured.");
      
      const { extForMime } = require("../middleware/upload");
      const ext = extForMime(req.file.mimetype);
      const crypto = require("crypto");
      const filename = `${crypto.randomUUID()}${ext}`;

      const { data, error } = await supabase.storage
        .from('leave-documents')
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      documentUrl = filename;
      documentName = req.file.originalname;
    }

    const leave = await Leave.create({
      employeeId: req.user.id, // from the JWT, never from the body
      reason: body.reason,
      startDate: body.start_date,
      endDate: body.end_date,
      documentUrl,
      documentName,
    });

    return res.status(201).json({ leave });
  } catch (err) {
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

/** Employee: unseen status changes, Manager: pending review count. */
async function notifications(req, res, next) {
  try {
    if (req.user.role === 'manager') {
      const leaves = await Leave.listAll('pending');
      return res.json({ count: leaves.length, notifications: leaves });
    }
    const leaves = await Leave.listUnnotified(req.user.id);
    return res.json({ notifications: leaves, count: leaves.length });
  } catch (err) {
    return next(err);
  }
}

/** All roles: leave balances. */
async function balances(req, res, next) {
  try {
    const leaves = await Leave.listByEmployee(req.user.id);
    
    // Default allocations
    const balancesData = [
      { id: 'annual', label: "Annual Leave", total: 30, color: "bg-[#0B6E4F]", textColor: "text-[#0B6E4F]", bg: "bg-[#E6F8F0]", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { id: 'casual', label: "Casual Leave", total: 15, color: "bg-[#2E83F9]", textColor: "text-[#2E83F9]", bg: "bg-[#F4F7FF]", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
      { id: 'sick', label: "Sick Leave", total: 15, color: "bg-[#DC2626]", textColor: "text-[#DC2626]", bg: "bg-[#FEF2F2]", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      { id: 'comp', label: "Comp Off", total: 10, color: "bg-[#9333EA]", textColor: "text-[#9333EA]", bg: "bg-[#F3E8FF]", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    ];
    
    const used = { annual: 0, casual: 0, sick: 0, comp: 0 };
    
    leaves.filter(l => l.status === 'approved').forEach(l => {
      const days = Math.round((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1;
      const reason = (l.reason || '').toLowerCase();
      if (reason.includes("sick")) used.sick += days;
      else if (reason.includes("casual")) used.casual += days;
      else if (reason.includes("comp")) used.comp += days;
      else used.annual += days;
    });

    const result = balancesData.map(b => ({
      ...b,
      used: used[b.id]
    }));

    return res.json({ balances: result });
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

    if (!supabase) throw new Error("Supabase is not configured.");

    const filename = path.basename(leave.document_url);
    const { data, error } = await supabase.storage
      .from('leave-documents')
      .download(filename);

    if (error || !data) {
      return res.status(404).json({ error: "Document not found in storage" });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Type", data.type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.send(buffer);
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
  balances,
  ackNotifications,
  document,
  review,
};
