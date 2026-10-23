import mongoose from "mongoose";

export const ASSIGNMENT_STATUSES = ["ACTIVE", "ENDED", "CANCELLED"];

const transportAssignmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportRoute", required: true },
    stopId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportStop", required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "ACTIVE" },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    remarks: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// A student has only one ACTIVE assignment at a time (spec: "one ACTIVE assignment per student").
transportAssignmentSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
transportAssignmentSchema.index({ vehicleId: 1, status: 1 });
transportAssignmentSchema.index({ routeId: 1, status: 1 });

const TransportAssignment = mongoose.model("TransportAssignment", transportAssignmentSchema);

export default TransportAssignment;
