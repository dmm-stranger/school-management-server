import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const logVisitorSchema = z.object({
  body: z.object({
    studentId: objectId,
    visitorName: z.string().trim().min(1, "Visitor name is required."),
    visitorPhone: z.string().trim().optional(),
    relation: z.string().trim().optional(),
    purpose: z.string().trim().optional(),
  }),
});

export const checkOutVisitorSchema = z.object({ params: z.object({ id: objectId }) });

export const listVisitorsSchema = z.object({
  query: z.object({ studentId: objectId.optional(), hostelId: objectId.optional(), activeOnly: z.enum(["true", "false"]).optional() }).passthrough(),
});
