import mongoose from "mongoose";
import { FEE_FREQUENCIES } from "../transport-route/transportRoute.model.js";

export const TRANSPORT_FEE_STATUSES = ["PENDING", "PARTIAL", "PAID", "CANCELLED"];

const transportFeeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportAssignment", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportRoute", required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    amount: { type: Number, required: true, min: 0 }, // snapshot of the route's fee at assignment time
    feeFrequency: { type: String, enum: FEE_FREQUENCIES, required: true },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: TRANSPORT_FEE_STATUSES, default: "PENDING" },
  },
  { timestamps: true }
);

transportFeeSchema.index({ studentId: 1, status: 1 });
transportFeeSchema.index({ assignmentId: 1 });

const TransportFee = mongoose.model("TransportFee", transportFeeSchema);

export default TransportFee;
