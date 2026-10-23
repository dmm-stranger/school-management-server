import mongoose from "mongoose";

export const FEE_FREQUENCIES = ["MONTHLY", "TERM", "ANNUAL"];

const transportRouteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Route A - Uttara"
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    fee: { type: Number, required: true, min: 0 },
    feeFrequency: { type: String, enum: FEE_FREQUENCIES, default: "MONTHLY" },
    description: { type: String, trim: true, default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

transportRouteSchema.index({ vehicleId: 1 });
transportRouteSchema.index({ name: 1 });

const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);

export default TransportRoute;
