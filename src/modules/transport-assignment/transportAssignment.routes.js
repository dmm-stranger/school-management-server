import { Router } from "express";
import * as assignmentController from "./transportAssignment.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createAssignmentSchema, endAssignmentSchema, assignmentIdSchema, listAssignmentsSchema } from "./transportAssignment.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("transport:create"), validate(createAssignmentSchema), assignmentController.createAssignment);
router.get("/", authorize("transport:list"), validate(listAssignmentsSchema), assignmentController.listAssignments);
// Static route BEFORE /:id.
router.get("/my", authorize("transport:read"), assignmentController.getMyAssignment);
router.get("/:id", authorize("transport:read"), validate(assignmentIdSchema), assignmentController.getAssignment);
router.post("/:id/end", authorize("transport:update"), validate(endAssignmentSchema), assignmentController.endAssignment);

export default router;
