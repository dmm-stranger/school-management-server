import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

const isbn = z
  .string()
  .trim()
  .regex(/^(?:\d{9}[\dXx]|\d{13})$/, "ISBN must be 10 or 13 characters (digits only, no dashes; last char of ISBN-10 may be X).");

const bookFields = {
  title: z.string().trim().min(1, "Title is required."),
  subtitle: z.string().trim().optional(),
  isbn: isbn.optional(),
  categoryId: objectId,
  authorIds: z.array(objectId).min(1, "Select at least one author."),
  publisherId: objectId.optional(),
  edition: z.string().trim().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).optional(),
  language: z.string().trim().optional(),
  description: z.string().trim().optional(),
  shelfLocation: z.string().trim().optional(),
  price: z.number().min(0).optional(),
};

export const createBookSchema = z.object({
  body: z.object({
    ...bookFields,
    initialCopies: z.number().int().min(0).max(100, "Add at most 100 copies at creation.").optional(),
  }),
});

export const updateBookSchema = z.object({
  body: z.object({
    ...Object.fromEntries(Object.entries(bookFields).map(([k, v]) => [k, v.optional()])),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getBookSchema = z.object({ params: z.object({ id: objectId }) });
