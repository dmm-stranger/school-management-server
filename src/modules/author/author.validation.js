import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createAuthorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required."),
    bio: z.string().trim().optional(),
  }),
});

export const updateAuthorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required.").optional(),
    bio: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getAuthorSchema = z.object({
  params: z.object({ id: objectId }),
});
