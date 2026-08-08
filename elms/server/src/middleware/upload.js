"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");

const ALLOWED = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);

const storage = multer.memoryStorage();

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

const IMAGE_ONLY = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);

function imageFilter(req, file, cb) {
  if (!IMAGE_ONLY.has(file.mimetype)) {
    const err = new Error("Only PNG and JPEG images are allowed for profile pictures");
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB max for profile pics
});

module.exports = { upload, uploadImage, ALLOWED_MIME: ALLOWED, extForMime: (mime) => ALLOWED.get(mime) || IMAGE_ONLY.get(mime) || "" };
