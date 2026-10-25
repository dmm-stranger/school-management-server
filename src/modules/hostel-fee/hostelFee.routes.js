import { Router } from "express";
import * as feeController from "./hostelFee.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { payHostelFeeSchema, adjustHostelFeeSchema, feeIdSchema, listHostelFeesSchema } from "./hostelFee.validation.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize("hostel:list"), validate(listHostelFeesSchema), feeController.listHostelFees);
router.get("/:id", authorize("hostel:read"), validate(feeIdSchema), feeController.getHostelFee);
router.post("/:id/pay", authorize("hostel:update"), validate(payHostelFeeSchema), feeController.payHostelFee);
// Discount/fine adjustments need hostel:approve (Admin has it; Warden deliberately does not), same as Library's waive.
router.patch("/:id/adjust", authorize("hostel:approve"), validate(adjustHostelFeeSchema), feeController.adjustHostelFee);

export default router;
