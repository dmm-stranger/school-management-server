import { z } from "zod";

const limit = z
  .object({
    maxBooks: z.number().int().min(1, "Must allow at least 1 book."),
    loanDays: z.number().int().min(1, "Loan period must be at least 1 day."),
  })
  .partial();

export const updateLibrarySettingsSchema = z.object({
  body: z.object({
    borrowLimits: z.object({ STUDENT: limit, TEACHER: limit, STAFF: limit }).partial().optional(),
    finePerDay: z.number().min(0).optional(),
    maxFinePerIssue: z.number().min(0).nullable().optional(),
    maxRenewals: z.number().int().min(0).optional(),
    lostBookUsePrice: z.boolean().optional(),
    lostBookFlatFine: z.number().min(0).optional(),
    blockIssueWithPendingFines: z.boolean().optional(),
  }),
});
