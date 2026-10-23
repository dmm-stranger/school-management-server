import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required."),
    phone: z.string().trim().min(6, "Enter a valid phone number."),
    licenseNumber: z.string().trim().min(1, "License number is required."),
    licenseExpiry: z.coerce.date().optional(),
    address: z.string().trim().optional(),
    staffId: objectId.optional(),
  }),
});

export const updateDriverSchema = z.object({
  body: createDriverSchema.shape.body.partial().extend({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() }),
  params: z.object({ id: objectId }),
});

export const getDriverSchema = z.object({ params: z.object({ id: objectId }) });
