import mongoose from "mongoose";

export const HOSTEL_FEE_STATUSES = ["PENDING", "PARTIAL", "PAID", "CANCELLED"];

/** Same audit-trail shape as StudentFee.adjustments (Phase 6) — "follows the Finance module rules". */
const adjustmentSchema = new mongoose.Schema(
  {
    field: { type: String, enum: ["discount", "fine"], required: true },
    previousValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, trim: true, default: null },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const hostelFeeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    allocationId: { type: mongoose.Schema.Types.ObjectId, ref: "HostelAllocation", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    amount: { type: Number, required: true, min: 0 }, // snapshot of the hostel's fee at allocation time
    feeFrequency: { type: String, enum: ["MONTHLY", "TERM", "ANNUAL"], required: true },
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: HOSTEL_FEE_STATUSES, default: "PENDING" },
    adjustments: [adjustmentSchema],
  },
  { timestamps: true }
);

hostelFeeSchema.index({ studentId: 1, status: 1 });
hostelFeeSchema.index({ allocationId: 1 });

const HostelFee = mongoose.model("HostelFee", hostelFeeSchema);

export default HostelFee;
