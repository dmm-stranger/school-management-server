import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const createAssignmentSchema = z.object({
  body: z.object({
    studentId: objectId,
    routeId: objectId,
    stopId: objectId,
    remarks: z.string().trim().optional(),
  }),
});

export const endAssignmentSchema = z.object({
  body: z.object({ remarks: z.string().trim().optional() }),
  params: z.object({ id: objectId }),
});

export const assignmentIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listAssignmentsSchema = z.object({
  query: z
    .object({
      status: z.enum(["ACTIVE", "ENDED", "CANCELLED"]).optional(),
      vehicleId: objectId.optional(),
      routeId: objectId.optional(),
    })
    .passthrough(),
});
