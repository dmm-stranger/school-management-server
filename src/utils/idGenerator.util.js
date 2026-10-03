import mongoose from "mongoose";

/**
 * Simple atomic counter collection to generate sequential, human-readable IDs
 * like STU-2026-00001, EMP-T-2026-00001, without race conditions.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "student-2026"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const nextSequence = async (key) => {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
};

const pad = (num, size = 5) => String(num).padStart(size, "0");

export const generateStudentId = async () => {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`student-${year}`);
  return `STU-${year}-${pad(seq)}`;
};

export const generateEmployeeId = async (type) => {
  // type: "T" (teacher) | "S" (staff)
  const year = new Date().getFullYear();
  const seq = await nextSequence(`employee-${type}-${year}`);
  return `EMP-${type}-${year}-${pad(seq)}`;
};

export const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`receipt-${year}`);
  return `RCPT-${year}-${pad(seq)}`;
};

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`invoice-${year}`);
  return `INV-${year}-${pad(seq)}`;
};

export const generateBookBarcode = async () => {
  // Global (not per-year) — a physical barcode label must never repeat or reset.
  const seq = await nextSequence("book-barcode");
  return `BK-${pad(seq, 6)}`;
};
