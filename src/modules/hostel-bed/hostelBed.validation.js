import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { MANUAL_BED_STATUSES } from "./hostelBed.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createBedsSchema = z.object({
  body: z.object({
    roomId: objectId,
    bedNumbers: z
      .array(z.string().trim().min(1))
      .min(1, "Provide at least one bed number.")
      .max(50, "Add at most 50 beds at a time."),
  }),
});

export const updateBedSchema = z.object({
  body: z.object({ status: z.enum(MANUAL_BED_STATUSES) }),
  params: z.object({ id: objectId }),
});

export const getBedSchema = z.object({ params: z.object({ id: objectId }) });
