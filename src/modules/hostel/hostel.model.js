import mongoose from "mongoose";

export const HOSTEL_TYPES = ["BOYS", "GIRLS", "MIXED"];
export const FEE_FREQUENCIES = ["MONTHLY", "TERM", "ANNUAL"];

const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: HOSTEL_TYPES, required: true },
    address: { type: String, trim: true, default: null },
    // "Warden assigned to Hostel" (flow doc). A Staff member, not a new entity: unlike Driver,
    // a warden needs no hostel-specific fields of their own (no license etc.) beyond who they are.
    wardenId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    fee: { type: Number, required: true, min: 0 }, // "Hostel Fee generated" — from the hostel, same as Transport's route.fee
    feeFrequency: { type: String, enum: FEE_FREQUENCIES, default: "MONTHLY" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hostelSchema.index({ name: 1 });
hostelSchema.index({ wardenId: 1 });

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel;
