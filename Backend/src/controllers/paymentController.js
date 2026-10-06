import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { getBookingById, expireOverdueDeposits, autoConfirmWorkDone } from "../models/bookingModel.js";
import {
  normalizeReference,
  normalizeGcashNumber,
  submitDeposit as submitDepositModel,
  getDepositProof,
  listDepositsToVerify,
  verifyDeposit as verifyDepositModel,
  rejectDeposit as rejectDepositModel,
  listPayoutsDue,
  sendPayout as sendPayoutModel,
  listRefundsDue,
  sendRefund as sendRefundModel,
  listHolds,
  resolveHold as resolveHoldModel,
} from "../models/paymentModel.js";
import { notify, notifyAdmins } from "./bookingController.js";
import { formatPeso } from "../utils/money.js";
import { sendError } from "../utils/http.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Outside any static directory: proofs are only reachable through streamDepositProof.
const PROOF_DIR = path.resolve(__dirname, "../../uploads/payment-proofs");

const getUserId = (req) => Number(req.userId);

// ── Client: deposit upload ───────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single("screenshot");

export const parseDepositUpload = (req, res, next) =>
  upload(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "The screenshot must be 5 MB or smaller."
      : "Could not read the upload. Attach one image as \"screenshot\".";
    res.status(400).json({ message });
  });

// Trust the file's bytes, not the client-supplied MIME type or name.
const imageExtension = (buf) => {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};

export const submitDeposit = async (req, res) => {
  let unsavedFile = null;
  try {
    const bookingId = Number(req.params.bookingId);
    const extension = req.file ? imageExtension(req.file.buffer) : null;
    if (!extension) {
      return res.status(400).json({ message: "Upload a screenshot of your GCash payment (JPG, PNG or WebP)." });
    }
    const reference = normalizeReference(req.body.gcashReference);
    const gcashNumber = normalizeGcashNumber(req.body.gcashNumber);

    const fileName = `${crypto.randomUUID()}.${extension}`;
    await fs.mkdir(PROOF_DIR, { recursive: true });
    unsavedFile = path.join(PROOF_DIR, fileName);
    await fs.writeFile(unsavedFile, req.file.buffer);
    await submitDepositModel({ bookingId, clientId: getUserId(req), reference, gcashNumber, proofPath: fileName });
    unsavedFile = null;

    const booking = await getBookingById(bookingId);
    await notifyAdmins(booking, "deposit_submitted", "Deposit to verify",
      `${booking.clientFirstName} ${booking.clientLastName} uploaded a ${formatPeso(booking.depositAmount)} deposit for booking #${booking.bookingId}.`);
    res.status(201).json({ message: "Payment submitted for verification", booking });
  } catch (err) {
    sendError(res, err, "Failed to submit payment");
  } finally {
    if (unsavedFile) await fs.unlink(unsavedFile).catch(() => {});
  }
};

// Admins, and the client who uploaded it. Nobody else, including the provider.
export const streamDepositProof = async (req, res) => {
  try {
    const proof = await getDepositProof(Number(req.params.paymentId));
    if (!proof || (req.userRole !== "admin" && proof.clientId !== getUserId(req))) {
      return res.status(404).json({ message: "Proof not found" });
    }
    res.set({ "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" });
    res.sendFile(path.join(PROOF_DIR, path.basename(proof.proofPath)), (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: "Proof file is missing" });
    });
  } catch (err) {
    sendError(res, err, "Failed to load proof");
  }
};

// ── Admin ────────────────────────────────────────────────────────────────────

const list = (load, key) => async (req, res) => {
  try {
    res.status(200).json({ [key]: await load() });
  } catch (err) {
    sendError(res, err, `Failed to load ${key}`);
  }
};

export const getDepositsToVerify = list(listDepositsToVerify, "deposits");
export const getPayoutsDue = list(listPayoutsDue, "payouts");
export const getRefundsDue = list(listRefundsDue, "refunds");
export const getHolds = list(listHolds, "holds");

const requiredText = (value, max = 1000) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= max ? text : null;
};

export const verifyDeposit = async (req, res) => {
  try {
    const bookingId = await verifyDepositModel(Number(req.params.paymentId), getUserId(req));
    const booking = await getBookingById(bookingId);
    notify(booking.clientId, booking, "deposit_verified", "Payment received",
      `We received your ${formatPeso(booking.depositAmount)} deposit for "${booking.serviceTitle}". Pay ${booking.providerName} the remaining ${formatPeso(booking.balanceOnSite)} on site.`);
    notify(booking.providerId, booking, "deposit_verified", "Job confirmed",
      `The client paid the deposit for "${booking.serviceTitle}". The job is confirmed.`);
    res.status(200).json({ message: "Deposit verified", booking });
  } catch (err) {
    sendError(res, err, "Failed to verify deposit");
  }
};

export const rejectDeposit = async (req, res) => {
  try {
    const reason = requiredText(req.body.reason, 500);
    if (!reason) return res.status(400).json({ message: "Give the client a reason (up to 500 characters)." });
    const bookingId = await rejectDepositModel(Number(req.params.paymentId), getUserId(req), reason);
    const booking = await getBookingById(bookingId);
    notify(booking.clientId, booking, "deposit_rejected", "Payment not verified",
      `We couldn't verify your deposit for "${booking.serviceTitle}": ${reason} Please upload it again before the deadline.`);
    res.status(200).json({ message: "Deposit rejected", booking });
  } catch (err) {
    sendError(res, err, "Failed to reject deposit");
  }
};

export const sendPayout = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const result = await sendPayoutModel(bookingId, getUserId(req), req.body.gcashReference);
    const booking = await getBookingById(bookingId);
    const penaltyNote = result.deducted > 0 ? ` ${formatPeso(result.deducted)} was deducted for a late-cancellation penalty.` : "";
    notify(result.providerId, booking, "payout_sent", "Payout sent",
      `We sent ${formatPeso(result.amount)} to your GCash for "${booking.serviceTitle}".${penaltyNote}`);
    res.status(200).json({ message: "Payout recorded", booking });
  } catch (err) {
    sendError(res, err, "Failed to record payout");
  }
};

export const sendRefund = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const result = await sendRefundModel(bookingId, getUserId(req), req.body.gcashReference);
    const booking = await getBookingById(bookingId);
    notify(result.clientId, booking, "refund_sent", "Refund sent",
      `We sent your ${formatPeso(result.amount)} refund for "${booking.serviceTitle}" to your GCash.`);
    res.status(200).json({ message: "Refund recorded", booking });
  } catch (err) {
    sendError(res, err, "Failed to record refund");
  }
};

export const resolveHold = async (req, res) => {
  try {
    const note = requiredText(req.body.note);
    if (!note) return res.status(400).json({ message: "Add a note explaining the resolution." });
    const bookingId = Number(req.params.bookingId);
    const result = await resolveHoldModel(bookingId, getUserId(req), { ...req.body, note });
    const booking = await getBookingById(bookingId);
    const message = `An admin resolved the problem with "${booking.serviceTitle}": ${note}`;
    notify(result.clientId, booking, "hold_resolved", "Problem resolved",
      result.refundDue > 0 ? `${message} You'll be refunded ${formatPeso(result.refundDue)}.` : message);
    notify(result.providerId, booking, "hold_resolved", "Problem resolved",
      result.payoutDue > 0 ? `${message} Your payout is ${formatPeso(result.payoutDue)}.` : message);
    res.status(200).json({ message: "Resolved", booking });
  } catch (err) {
    sendError(res, err, "Failed to resolve");
  }
};

// ── Background jobs ──────────────────────────────────────────────────────────

export const runPaymentJobs = async () => {
  for (const id of await expireOverdueDeposits()) {
    const booking = await getBookingById(id);
    notify(booking.clientId, booking, "booking_expired", "Booking expired",
      `Your booking for "${booking.serviceTitle}" expired because the deposit wasn't paid in time.`);
    notify(booking.providerId, booking, "booking_expired", "Booking expired",
      `The booking for "${booking.serviceTitle}" expired because the client didn't pay the deposit.`);
  }
  for (const id of await autoConfirmWorkDone()) {
    const booking = await getBookingById(id);
    notify(booking.clientId, booking, "booking_completed", "Service completed",
      `"${booking.serviceTitle}" was confirmed automatically 2 days after the provider marked it done.`);
    notify(booking.providerId, booking, "booking_completed", "Job completed",
      `"${booking.serviceTitle}" was confirmed automatically. Your ${formatPeso(booking.payoutDue)} payout is on its way.`);
  }
};
