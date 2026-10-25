import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createAllocationSchema = z.object({
  body: z.object({
    studentId: objectId,
    roomId: objectId,
    bedId: objectId,
    remarks: z.string().trim().optional(),
  }),
});

export const endAllocationSchema = z.object({
  body: z.object({ remarks: z.string().trim().optional() }),
  params: z.object({ id: objectId }),
});

export const allocationIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listAllocationsSchema = z.object({
  query: z
    .object({
      status: z.enum(["ACTIVE", "ENDED", "CANCELLED"]).optional(),
      hostelId: objectId.optional(),
      roomId: objectId.optional(),
    })
    .passthrough(),
});
