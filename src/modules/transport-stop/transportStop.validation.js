import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createStopSchema = z.object({
  body: z.object({
    routeId: objectId,
    name: z.string().trim().min(1, "Stop name is required."),
    sequence: z.number().int().min(1, "Position must be 1 or higher."),
    pickupTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM, e.g. 07:30.")
      .optional(),
    landmark: z.string().trim().optional(),
  }),
});

export const updateStopSchema = z.object({
  body: createStopSchema.shape.body.omit({ routeId: true }).partial(),
  params: z.object({ id: objectId }),
});

export const getStopSchema = z.object({ params: z.object({ id: objectId }) });

export const reorderStopsSchema = z.object({
  body: z.object({
    stops: z
      .array(z.object({ id: objectId, sequence: z.number().int().min(1) }))
      .min(1, "Provide at least one stop to reorder."),
  }),
  params: z.object({ routeId: objectId }),
});
