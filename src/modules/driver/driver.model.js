import mongoose from "mongoose";

/**
 * Standalone, not a Staff sub-type: a driver carries license data no other
 * staff designation needs, and not every school treats its drivers as
 * payroll staff in this system. `staffId` is an optional link for schools
 * that do pay drivers through the Staff/payroll module.
 */
const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, default: null },
    address: { type: String, trim: true, default: null },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

driverSchema.index(
  { licenseNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
