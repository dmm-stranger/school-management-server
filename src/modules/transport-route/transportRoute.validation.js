import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { FEE_FREQUENCIES } from "./transportRoute.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createRouteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Route name is required."),
    vehicleId: objectId,
    fee: z.number().min(0, "Fee can't be negative."),
    feeFrequency: z.enum(FEE_FREQUENCIES).default("MONTHLY"),
    description: z.string().trim().optional(),
  }),
});

export const updateRouteSchema = z.object({
  body: createRouteSchema.shape.body.partial().extend({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() }),
  params: z.object({ id: objectId }),
});

export const getRouteSchema = z.object({ params: z.object({ id: objectId }) });
