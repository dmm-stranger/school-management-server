import mongoose from "mongoose";

export const ALLOCATION_STATUSES = ["ACTIVE", "ENDED", "CANCELLED"];

const hostelAllocationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "HostelRoom", required: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: "HostelBed", required: true },
    status: { type: String, enum: ALLOCATION_STATUSES, default: "ACTIVE" },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    remarks: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// "One ACTIVE allocation per student" (flow doc, explicit rule).
hostelAllocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
// "A bed can't be double-allocated" (flow doc, explicit rule).
hostelAllocationSchema.index(
  { bedId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
hostelAllocationSchema.index({ hostelId: 1, status: 1 });

const HostelAllocation = mongoose.model("HostelAllocation", hostelAllocationSchema);

export default HostelAllocation;
