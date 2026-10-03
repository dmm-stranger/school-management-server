import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { BORROWER_TYPES, ISSUE_STATUSES, RETURN_CONDITIONS } from "./bookIssue.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const issueBookSchema = z.object({
  body: z.object({
    barcode: z.string().trim().min(1, "Scan or enter the copy's barcode."),
    borrowerId: objectId,
    remarks: z.string().trim().optional(),
  }),
});

export const returnBookSchema = z.object({
  body: z
    .object({
      condition: z.enum(RETURN_CONDITIONS).default("GOOD"),
      damageFine: z.number().min(0, "Damage fine can't be negative.").default(0),
      remarks: z.string().trim().optional(),
    })
    .refine((b) => b.condition === "DAMAGED" || b.damageFine === 0, {
      message: "A damage fine can only be set when the book is returned damaged.",
      path: ["damageFine"],
    }),
  params: z.object({ id: objectId }),
});

export const issueIdSchema = z.object({ params: z.object({ id: objectId }) });
export const borrowerStatusSchema = z.object({ params: z.object({ userId: objectId }) });

export const listIssuesSchema = z.object({
  query: z
    .object({
      status: z.enum(ISSUE_STATUSES).optional(),
      overdue: z.enum(["true", "false"]).optional(),
      borrowerId: objectId.optional(),
      bookId: objectId.optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .passthrough(),
});

export const searchBorrowersSchema = z.object({
  query: z.object({ search: z.string().optional(), type: z.enum(BORROWER_TYPES).optional() }).passthrough(),
});
