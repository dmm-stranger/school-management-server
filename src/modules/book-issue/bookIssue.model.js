import mongoose from "mongoose";

export const BORROWER_TYPES = ["STUDENT", "TEACHER", "STAFF"];
export const ISSUE_STATUSES = ["ISSUED", "RETURNED", "LOST"];
export const RETURN_CONDITIONS = ["GOOD", "DAMAGED", "LOST"];

/**
 * Small immutable snapshot (allowed embedding per 02-database-design.md §3):
 * "Deleting a book/user must never remove issue history" — so the borrower's
 * name/code and the book title/barcode are copied at issue time, and history
 * still reads correctly after any of them is later renamed, deactivated or
 * soft-deleted.
 */
const borrowerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, default: null }, // studentId / employeeId
    profileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const bookIssueSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    copyId: { type: mongoose.Schema.Types.ObjectId, ref: "BookCopy", required: true },
    bookTitle: { type: String, required: true },
    barcode: { type: String, required: true },

    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    borrowerType: { type: String, enum: BORROWER_TYPES, required: true },
    borrower: { type: borrowerSnapshotSchema, required: true },

    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },

    // OVERDUE is deliberately NOT a stored status: it's derived (ISSUED && dueDate < now),
    // so it can never go stale between nightly jobs.
    status: { type: String, enum: ISSUE_STATUSES, default: "ISSUED" },
    renewalCount: { type: Number, default: 0, min: 0 },
    fineAmount: { type: Number, default: 0, min: 0 },
    returnCondition: { type: String, enum: [...RETURN_CONDITIONS, null], default: null },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    returnedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    remarks: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// One physical copy can be out with only ONE person at a time — enforced by the DB, not just app code.
bookIssueSchema.index({ copyId: 1 }, { unique: true, partialFilterExpression: { status: "ISSUED" } });
bookIssueSchema.index({ borrowerId: 1, status: 1 });
bookIssueSchema.index({ status: 1, dueDate: 1 });
bookIssueSchema.index({ bookId: 1 });

const BookIssue = mongoose.model("BookIssue", bookIssueSchema);

export default BookIssue;
