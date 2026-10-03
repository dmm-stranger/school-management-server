import mongoose from "mongoose";

export const FINE_REASONS = ["OVERDUE", "DAMAGED", "LOST"];
export const FINE_STATUSES = ["PENDING", "PAID", "WAIVED"];

const libraryFineSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "BookIssue", required: true },
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    borrowerProfileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // for Receipt.issuedTo
    borrowerName: { type: String, required: true },
    bookTitle: { type: String, required: true },
    reason: { type: String, enum: FINE_REASONS, required: true },
    daysOverdue: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: FINE_STATUSES, default: "PENDING" },

    paymentMethod: { type: String, default: null },
    paidAt: { type: Date, default: null },
    receiptNumber: { type: String, default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    waivedAt: { type: Date, default: null },
    waiveReason: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// A given issue can carry at most one fine per reason — re-running a return can't double-charge.
libraryFineSchema.index({ issueId: 1, reason: 1 }, { unique: true });
libraryFineSchema.index({ borrowerId: 1, status: 1 });

const LibraryFine = mongoose.model("LibraryFine", libraryFineSchema);

export default LibraryFine;
