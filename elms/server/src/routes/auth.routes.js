"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const authenticate = require("../middleware/authenticate");
const controller = require("../controllers/auth.controller");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many accounts created from this IP. Try again later." },
});

const { upload, uploadImage } = require("../middleware/upload");

router.post("/register", registerLimiter, controller.register);
router.post("/login", loginLimiter, controller.login);
router.get("/me", authenticate, controller.me);
router.patch("/profile", authenticate, uploadImage.single("profile_pic"), controller.updateProfile);
router.get("/profile-pic/:filename", authenticate, controller.getProfilePic);

module.exports = router;
