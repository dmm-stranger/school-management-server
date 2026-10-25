import mongoose from "mongoose";

/**
 * "Visitor log tracked separately (permanent record)" (flow doc, explicit instruction).
 * Deliberately: no isDeleted field and no delete route anywhere in this module — a permanent
 * record is never removed. A mistaken entry is corrected by editing it, not deleting it.
 */
const hostelVisitorSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true }, // the resident being visited
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true }, // denormalized for direct hostel-level filtering
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, trim: true, default: null },
    relation: { type: String, trim: true, default: null }, // e.g. "Father", "Guardian"
    purpose: { type: String, trim: true, default: null },
    checkInTime: { type: Date, required: true, default: Date.now },
    checkOutTime: { type: Date, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

hostelVisitorSchema.index({ studentId: 1, checkInTime: -1 });
hostelVisitorSchema.index({ hostelId: 1, checkInTime: -1 });

const HostelVisitor = mongoose.model("HostelVisitor", hostelVisitorSchema);

export default HostelVisitor;
