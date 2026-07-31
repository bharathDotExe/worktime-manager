"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");

fs.mkdirSync(env.uploadDir, { recursive: true });

const ALLOWED = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    // Never reuse the client filename: it can contain ../, null bytes, or a
    // second extension. We derive the extension from the whitelisted MIME type.
    const ext = ALLOWED.get(file.mimetype) || "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED.has(file.mimetype)) {
    const err = new Error("Only PDF, PNG and JPEG files are allowed");
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
});

module.exports = { upload, ALLOWED_MIME: ALLOWED };
