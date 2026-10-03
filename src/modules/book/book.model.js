import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: null },
    isbn: { type: String, trim: true, default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "BookCategory", required: true },
    authorIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
      validate: [(v) => v.length > 0, "At least one author is required."],
    },
    publisherId: { type: mongoose.Schema.Types.ObjectId, ref: "Publisher", default: null },
    edition: { type: String, trim: true, default: null },
    publishedYear: { type: Number, min: 1000, max: 3000, default: null },
    language: { type: String, trim: true, default: "English" },
    description: { type: String, trim: true, default: null },
    shelfLocation: { type: String, trim: true, default: null }, // e.g. "ACA-RED / RM60 / Shelf B3"
    price: { type: Number, min: 0, default: null }, // used for the lost-book penalty
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ISBN unique only among live books, so a soft-deleted book never blocks re-cataloguing.
bookSchema.index(
  { isbn: 1 },
  { unique: true, partialFilterExpression: { isbn: { $type: "string" }, isDeleted: false } }
);
bookSchema.index({ title: "text", subtitle: "text" }); // text index per 02-database-design.md §3.3
bookSchema.index({ categoryId: 1 });
bookSchema.index({ authorIds: 1 });

const Book = mongoose.model("Book", bookSchema);

export default Book;
