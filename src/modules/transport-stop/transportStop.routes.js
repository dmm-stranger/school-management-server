import { Router } from "express";
import * as stopController from "./transportStop.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createStopSchema, updateStopSchema, getStopSchema, reorderStopsSchema } from "./transportStop.validation.js";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const routeIdSchema = z.object({ params: z.object({ routeId: z.string().refine(isValidObjectId, "Invalid ID.") }) });

router.post("/", authorize("transport:create"), validate(createStopSchema), stopController.createStop);
router.get("/route/:routeId", authorize("transport:list"), validate(routeIdSchema), stopController.listStopsForRoute);
router.patch("/route/:routeId/reorder", authorize("transport:update"), validate(reorderStopsSchema), stopController.reorderStops);
router.get("/:id", authorize("transport:read"), validate(getStopSchema), stopController.getStop);
router.patch("/:id", authorize("transport:update"), validate(updateStopSchema), stopController.updateStop);
router.delete("/:id", authorize("transport:delete"), validate(getStopSchema), stopController.deleteStop);

export default router;
