import { Router } from "express";
import * as fineController from "./libraryFine.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { payFineSchema, waiveFineSchema, fineIdSchema, listFinesSchema } from "./libraryFine.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("library:list"), validate(listFinesSchema), fineController.listFines);
router.get("/:id", authorize("library:read"), validate(fineIdSchema), fineController.getFine);
router.post("/:id/pay", authorize("library:update"), validate(payFineSchema), fineController.payFine);
// Waiving forgives money owed — needs library:approve (Admin has it; Librarian deliberately does not).
router.post("/:id/waive", authorize("library:approve"), validate(waiveFineSchema), fineController.waiveFine);

export default router;
