import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createBookCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required."),
    description: z.string().trim().optional(),
  }),
});

export const updateBookCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required.").optional(),
    description: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getBookCategorySchema = z.object({
  params: z.object({ id: objectId }),
});
