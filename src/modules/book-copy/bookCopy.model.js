import mongoose from "mongoose";

export const COPY_STATUSES = ["AVAILABLE", "ISSUED", "LOST", "DAMAGED", "MAINTENANCE", "RETIRED"];
/** Statuses a librarian may set by hand. ISSUED is only ever set by the issue flow. */
export const MANUAL_COPY_STATUSES = ["AVAILABLE", "LOST", "DAMAGED", "MAINTENANCE", "RETIRED"];

const bookCopySchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: COPY_STATUSES, default: "AVAILABLE" },
    acquiredDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookCopySchema.index({ bookId: 1, status: 1 });

const BookCopy = mongoose.model("BookCopy", bookCopySchema);

export default BookCopy;
