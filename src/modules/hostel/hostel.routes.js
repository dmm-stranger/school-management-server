import { Router } from "express";
import * as hostelController from "./hostel.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createHostelSchema, updateHostelSchema, getHostelSchema } from "./hostel.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("hostel:create"), validate(createHostelSchema), hostelController.createHostel);
router.get("/", authorize("hostel:list"), hostelController.listHostels);
router.get("/:id", authorize("hostel:read"), validate(getHostelSchema), hostelController.getHostel);
router.patch("/:id", authorize("hostel:update"), validate(updateHostelSchema), hostelController.updateHostel);
router.delete("/:id", authorize("hostel:delete"), validate(getHostelSchema), hostelController.deleteHostel);

export default router;
