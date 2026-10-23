import { Router } from "express";
import * as feeController from "./transportFee.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { payTransportFeeSchema, feeIdSchema, listTransportFeesSchema } from "./transportFee.validation.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize("transport:list"), validate(listTransportFeesSchema), feeController.listTransportFees);
router.get("/:id", authorize("transport:read"), validate(feeIdSchema), feeController.getTransportFee);
router.post("/:id/pay", authorize("transport:update"), validate(payTransportFeeSchema), feeController.payTransportFee);

export default router;
