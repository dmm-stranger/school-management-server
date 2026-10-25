import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import * as bedController from "./hostelBed.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createBedsSchema, updateBedSchema, getBedSchema } from "./hostelBed.validation.js";

const router = Router();
router.use(authenticate);

const roomIdSchema = z.object({ params: z.object({ roomId: z.string().refine(isValidObjectId, "Invalid ID.") }) });

router.post("/", authorize("hostel:create"), validate(createBedsSchema), bedController.createBeds);
router.get("/room/:roomId", authorize("hostel:list"), validate(roomIdSchema), bedController.listBedsForRoom);
router.get("/:id", authorize("hostel:read"), validate(getBedSchema), bedController.getBed);
router.patch("/:id", authorize("hostel:update"), validate(updateBedSchema), bedController.updateBed);
router.delete("/:id", authorize("hostel:delete"), validate(getBedSchema), bedController.deleteBed);

export default router;
