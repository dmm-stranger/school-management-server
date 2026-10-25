import { Router } from "express";
import * as allocationController from "./hostelAllocation.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createAllocationSchema, endAllocationSchema, allocationIdSchema, listAllocationsSchema } from "./hostelAllocation.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("hostel:create"), validate(createAllocationSchema), allocationController.createAllocation);
router.get("/", authorize("hostel:list"), validate(listAllocationsSchema), allocationController.listAllocations);
router.get("/my", authorize("hostel:read"), allocationController.getMyAllocation);
router.get("/:id", authorize("hostel:read"), validate(allocationIdSchema), allocationController.getAllocation);
router.post("/:id/end", authorize("hostel:update"), validate(endAllocationSchema), allocationController.endAllocation);

export default router;
