import mongoose from "mongoose";

const limitSchema = new mongoose.Schema(
  {
    maxBooks: { type: Number, required: true, min: 1 },
    loanDays: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/**
 * Singleton (key = "default"). The spec lists a `librarySettings` collection
 * (Settings phase) and says borrow limits are "configurable per role" — this
 * is that collection, created now because Issue/Return can't run without
 * limits. Phase 14 (Settings) only needs to add its screen.
 */
const librarySettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    borrowLimits: {
      STUDENT: { type: limitSchema, default: () => ({ maxBooks: 3, loanDays: 14 }) },
      TEACHER: { type: limitSchema, default: () => ({ maxBooks: 5, loanDays: 30 }) },
      STAFF: { type: limitSchema, default: () => ({ maxBooks: 3, loanDays: 14 }) },
    },
    finePerDay: { type: Number, default: 5, min: 0 },
    maxFinePerIssue: { type: Number, default: null, min: 0 }, // null = uncapped
    maxRenewals: { type: Number, default: 2, min: 0 },
    lostBookUsePrice: { type: Boolean, default: true },
    lostBookFlatFine: { type: Number, default: 500, min: 0 },
    blockIssueWithPendingFines: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const LibrarySetting = mongoose.model("LibrarySetting", librarySettingSchema);

export default LibrarySetting;
