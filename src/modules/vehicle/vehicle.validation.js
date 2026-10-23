import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { VEHICLE_TYPES } from "./vehicle.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createVehicleSchema = z.object({
  body: z.object({
    vehicleNumber: z.string().trim().min(1, "Vehicle/registration number is required."),
    type: z.enum(VEHICLE_TYPES),
    seatCapacity: z.number().int().min(1, "Seat capacity must be at least 1."),
    driverId: objectId.optional(),
    notes: z.string().trim().optional(),
  }),
});

export const updateVehicleSchema = z.object({
  body: createVehicleSchema.shape.body.partial().extend({
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
    driverId: objectId.nullable().optional(), // null explicitly unassigns the driver
  }),
  params: z.object({ id: objectId }),
});

export const getVehicleSchema = z.object({ params: z.object({ id: objectId }) });
