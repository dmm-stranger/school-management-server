import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { MANUAL_COPY_STATUSES, COPY_STATUSES } from "./bookCopy.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createCopiesSchema = z.object({
  body: z.object({
    bookId: objectId,
    count: z.number().int().min(1, "Add at least 1 copy.").max(100, "Add at most 100 copies at a time.").default(1),
    acquiredDate: z.coerce.date().optional(),
    notes: z.string().trim().optional(),
  }),
});

export const updateCopySchema = z.object({
  body: z.object({
    status: z.enum(MANUAL_COPY_STATUSES).optional(),
    notes: z.string().trim().optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getCopySchema = z.object({ params: z.object({ id: objectId }) });
export const barcodeSchema = z.object({ params: z.object({ barcode: z.string().trim().min(1) }) });
export const listCopiesSchema = z.object({
  query: z.object({ status: z.enum(COPY_STATUSES).optional() }).passthrough(),
});
