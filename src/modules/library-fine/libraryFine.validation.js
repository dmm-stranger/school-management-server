import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { FINE_REASONS, FINE_STATUSES } from "./libraryFine.model.js";
import { PAYMENT_METHOD_VALUES } from "../payment/payment.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const payFineSchema = z.object({
  body: z.object({ paymentMethod: z.enum(PAYMENT_METHOD_VALUES) }),
  params: z.object({ id: objectId }),
});

export const waiveFineSchema = z.object({
  body: z.object({ reason: z.string().trim().min(3, "Give a reason for waiving this fine.") }),
  params: z.object({ id: objectId }),
});

export const fineIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listFinesSchema = z.object({
  query: z
    .object({
      status: z.enum(FINE_STATUSES).optional(),
      reason: z.enum(FINE_REASONS).optional(),
      borrowerId: objectId.optional(),
    })
    .passthrough(),
});
