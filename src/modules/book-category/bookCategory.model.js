import mongoose from "mongoose";

const bookCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookCategorySchema.index({ name: 1 });

const BookCategory = mongoose.model("BookCategory", bookCategorySchema);

export default BookCategory;
