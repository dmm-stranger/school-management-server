import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    referenceType: {
      type: String,
      required: true,
      enum: ["STUDENT_FEE_PAYMENT", "SALARY_PAYMENT", "LIBRARY_FINE"],
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    issuedTo: { type: mongoose.Schema.Types.ObjectId, required: true }, // Student or Teacher/Staff id
    issuedDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

receiptSchema.index({ receiptNumber: 1 }, { unique: true });

const Receipt = mongoose.model("Receipt", receiptSchema);

export default Receipt;
