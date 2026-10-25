import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { PAYMENT_METHOD_VALUES } from "../payment/payment.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const payHostelFeeSchema = z.object({
  body: z.object({
    amount: z.number().positive("Enter a payment amount greater than 0."),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  }),
  params: z.object({ id: objectId }),
});

/** Mirrors StudentFee's adjustment pattern: discount/fine changes require a reason. */
export const adjustHostelFeeSchema = z.object({
  body: z
    .object({
      discount: z.number().min(0).optional(),
      fine: z.number().min(0).optional(),
      reason: z.string().trim().min(3, "Give a reason for this adjustment."),
    })
    .refine((b) => b.discount !== undefined || b.fine !== undefined, { message: "Provide a discount or fine to adjust." }),
  params: z.object({ id: objectId }),
});

export const feeIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listHostelFeesSchema = z.object({
  query: z.object({ status: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELLED"]).optional(), studentId: objectId.optional() }).passthrough(),
});
