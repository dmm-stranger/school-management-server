import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createRoomSchema = z.object({
  body: z.object({
    hostelId: objectId,
    roomNumber: z.string().trim().min(1, "Room number is required."),
    floor: z.string().trim().optional(),
  }),
});

export const updateRoomSchema = z.object({
  body: createRoomSchema.shape.body.omit({ hostelId: true }).partial().extend({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() }),
  params: z.object({ id: objectId }),
});

export const getRoomSchema = z.object({ params: z.object({ id: objectId }) });
