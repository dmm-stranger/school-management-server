import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createPublisherSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required."),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email("Enter a valid email address.").optional(),
  }),
});

export const updatePublisherSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required.").optional(),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email("Enter a valid email address.").optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getPublisherSchema = z.object({
  params: z.object({ id: objectId }),
});
