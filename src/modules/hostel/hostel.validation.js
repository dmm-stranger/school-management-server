import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { HOSTEL_TYPES, FEE_FREQUENCIES } from "./hostel.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createHostelSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Hostel name is required."),
    type: z.enum(HOSTEL_TYPES),
    address: z.string().trim().optional(),
    wardenId: objectId.optional(),
    fee: z.number().min(0, "Fee can't be negative."),
    feeFrequency: z.enum(FEE_FREQUENCIES).default("MONTHLY"),
  }),
});

export const updateHostelSchema = z.object({
  body: createHostelSchema.shape.body.partial().extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    wardenId: objectId.nullable().optional(),
  }),
  params: z.object({ id: objectId }),
});

export const getHostelSchema = z.object({ params: z.object({ id: objectId }) });
