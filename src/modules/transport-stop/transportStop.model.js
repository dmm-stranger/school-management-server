import mongoose from "mongoose";

const transportStopSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportRoute", required: true },
    name: { type: String, required: true, trim: true }, // e.g. "Sector 7 Gate"
    sequence: { type: Number, required: true, min: 1 }, // 1 = first stop on the route
    pickupTime: { type: String, trim: true, default: null }, // "07:30" — display only, not a Date
    landmark: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A route can't have two stops claiming the same position.
transportStopSchema.index(
  { routeId: 1, sequence: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const TransportStop = mongoose.model("TransportStop", transportStopSchema);

export default TransportStop;
