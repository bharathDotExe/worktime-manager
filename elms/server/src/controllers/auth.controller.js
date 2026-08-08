"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/user.model");
const Log = require("../models/log.model");
const { credentialsSchema, registerSchema, parseOrThrow } = require("../utils/validators");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Initialize Supabase client (same as leaves.controller)
const supabase = env.supabaseUrl && env.supabaseKey
  ? createClient(env.supabaseUrl, env.supabaseKey)
  : null;

function signToken(user) {
  // Payload carries only the id and role; both are re-read from the signed
  // token on every request, so a client can never claim another identity.
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register(req, res, next) {
  try {
    const { username, password, full_name, department } = parseOrThrow(registerSchema, req.body);

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const hash = await bcrypt.hash(password, env.bcryptRounds);
    // Role is NOT read from req.body — createEmployee hardcodes 'employee'.
    const user = await User.createEmployee(username, hash, full_name, department);

    return res.status(201).json({
      token: signToken(user),
      id: user.id,
      role: user.role,
      username: user.username,
      full_name: user.full_name,
      department: user.department,
      profile_pic_url: user.profile_pic_url,
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = parseOrThrow(credentialsSchema, req.body);
    const user = await User.findByUsername(username);

    // Same generic message + a dummy compare so response timing and wording
    // don't reveal whether the username exists.
    const hash = user ? user.password_hash : "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Log the successful login attempt
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];
      await Log.recordLogin(user.id, ipAddress, userAgent);
    } catch (logErr) {
      console.error("Failed to record login log:", logErr);
      // We don't fail the login if logging fails.
    }

    // Fetch the full user record (includes full_name, department, profile_pic_url)
    const fullUser = await User.findById(user.id);

    return res.json({
      token: signToken(user),
      id: fullUser.id,
      role: fullUser.role,
      username: fullUser.username,
      full_name: fullUser.full_name,
      department: fullUser.department,
      profile_pic_url: fullUser.profile_pic_url,
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    return res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role,
      full_name: user.full_name,
      department: user.department,
      profile_pic_url: user.profile_pic_url,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    let profilePicUrl = null;
    const { full_name } = req.body;

    if (req.file) {
      if (!supabase) throw new Error("Supabase is not configured.");
      
      const { extForMime } = require("../middleware/upload");
      const ext = extForMime(req.file.mimetype);
      const crypto = require("crypto");
      const filename = `${crypto.randomUUID()}${ext}`;

      const { error } = await supabase.storage
        .from('profile-pictures')
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }
      profilePicUrl = filename;
    }

    const updatedUser = await User.updateProfile(req.user.id, full_name, profilePicUrl);
    
    return res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      full_name: updatedUser.full_name,
      department: updatedUser.department,
      profile_pic_url: updatedUser.profile_pic_url,
    });
  } catch (err) {
    return next(err);
  }
}

async function getProfilePic(req, res, next) {
  try {
    const filename = req.params.filename;
    if (!filename) return res.status(400).json({ error: "Filename is required" });

    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .download(filename);

    if (error || !data) {
      return res.status(404).json({ error: "Image not found" });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Type", data.type);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me, updateProfile, getProfilePic };
