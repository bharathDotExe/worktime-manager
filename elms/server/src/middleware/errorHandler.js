"use strict";

const multer = require("multer");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Full detail server-side only.
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large" : "File upload rejected";
    return res.status(400).json({ error: message });
  }

  const status = Number(err.status || err.statusCode || 500);
  if (status >= 500) {
    return res.status(500).json({ error: "Internal server error" });
  }
  return res.status(status).json({ error: err.message || "Request failed" });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}

module.exports = { errorHandler, notFoundHandler };
