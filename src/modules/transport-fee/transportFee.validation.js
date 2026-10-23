import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { TRANSPORT_FEE_STATUSES } from "./transportFee.model.js";
import { PAYMENT_METHOD_VALUES } from "../payment/payment.model.js";

const objectId = z.string().refine(isValidObjectId, "Invalid ID.");

export const payTransportFeeSchema = z.object({
  body: z.object({
    amount: z.number().positive("Enter a payment amount greater than 0."),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  }),
  params: z.object({ id: objectId }),
});

export const feeIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listTransportFeesSchema = z.object({
  query: z.object({ status: z.enum(TRANSPORT_FEE_STATUSES).optional(), studentId: objectId.optional() }).passthrough(),
});
