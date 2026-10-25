import mongoose from "mongoose";

export const BED_STATUSES = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RETIRED"];
/** Statuses a warden/admin may set by hand. OCCUPIED is only ever set by the allocation flow. */
export const MANUAL_BED_STATUSES = ["AVAILABLE", "MAINTENANCE", "RETIRED"];

const hostelBedSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true }, // denormalized for direct hostel-level filtering
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "HostelRoom", required: true },
    bedNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: BED_STATUSES, default: "AVAILABLE" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hostelBedSchema.index(
  { roomId: 1, bedNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
hostelBedSchema.index({ hostelId: 1, status: 1 });

const HostelBed = mongoose.model("HostelBed", hostelBedSchema);

export default HostelBed;
