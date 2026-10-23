import mongoose from "mongoose";

export const VEHICLE_TYPES = ["BUS", "MICROBUS", "VAN", "CAR"];

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true }, // registration plate
    type: { type: String, enum: VEHICLE_TYPES, required: true },
    seatCapacity: { type: Number, required: true, min: 1 },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"], default: "ACTIVE" },
    notes: { type: String, trim: true, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

vehicleSchema.index(
  { vehicleNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
vehicleSchema.index({ driverId: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
