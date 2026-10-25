import { Router } from "express";
import * as visitorController from "./hostelVisitor.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { logVisitorSchema, checkOutVisitorSchema, listVisitorsSchema } from "./hostelVisitor.validation.js";

const router = Router();
router.use(authenticate);

// Permanent record (flow doc): intentionally no PATCH-general or DELETE route beyond check-out.
router.post("/", authorize("hostel:create"), validate(logVisitorSchema), visitorController.logVisitor);
router.get("/", authorize("hostel:list"), validate(listVisitorsSchema), visitorController.listVisitors);
router.post("/:id/checkout", authorize("hostel:update"), validate(checkOutVisitorSchema), visitorController.checkOutVisitor);

export default router;
