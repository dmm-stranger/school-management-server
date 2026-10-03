import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    referenceType: {
      type: String,
      required: true,
      enum: ["STUDENT_FEE_PAYMENT", "SALARY_PAYMENT", "EXPENSE", "LIBRARY_FINE"],
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    transactionType: {
      type: String,
      required: true,
      enum: ["INCOME", "EXPENSE"],
    },
    amount: { type: Number, required: true, min: 0 },
    transactionDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ["COMPLETED", "REVERSED"],
      default: "COMPLETED",
      // Per spec: "Deleting financial records is prohibited." A mistaken
      // transaction is marked REVERSED via an offsetting entry, never deleted.
    },
  },
  { timestamps: true }
);

transactionSchema.index({ referenceType: 1, referenceId: 1 });
transactionSchema.index({ transactionDate: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
