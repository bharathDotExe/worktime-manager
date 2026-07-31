"use strict";

const { z } = require("zod");

// .strict() => unexpected extra fields are rejected, not silently ignored.
const credentialsSchema = z
  .object({
    username: z.string().trim().min(3).max(100),
    password: z.string().min(8).max(200),
  })
  .strict();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

const createLeaveSchema = z
  .object({
    reason: z.string().trim().min(5).max(1000),
    start_date: isoDate,
    end_date: isoDate,
  })
  .strict()
  .refine((v) => v.end_date >= v.start_date, {
    message: "end_date must be on or after start_date",
    path: ["end_date"],
  });

const reviewLeaveSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    manager_remarks: z.string().trim().min(3).max(1000),
  })
  .strict();

const ackSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(100),
  })
  .strict();

const listLeavesQuerySchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  })
  .strict();

const idParamSchema = z.coerce.number().int().positive();

/** Formats a ZodError into a single readable message. */
function formatZodError(err) {
  return err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
}

/** Parses `data` or throws a 400-tagged error handled by errorHandler. */
function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error(formatZodError(result.error));
    error.status = 400;
    throw error;
  }
  return result.data;
}

module.exports = {
  credentialsSchema,
  createLeaveSchema,
  reviewLeaveSchema,
  ackSchema,
  listLeavesQuerySchema,
  idParamSchema,
  parseOrThrow,
};
