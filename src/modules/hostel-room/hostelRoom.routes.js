import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import * as roomController from "./hostelRoom.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createRoomSchema, updateRoomSchema, getRoomSchema } from "./hostelRoom.validation.js";

const router = Router();
router.use(authenticate);

const hostelIdSchema = z.object({ params: z.object({ hostelId: z.string().refine(isValidObjectId, "Invalid ID.") }) });

router.post("/", authorize("hostel:create"), validate(createRoomSchema), roomController.createRoom);
router.get("/hostel/:hostelId", authorize("hostel:list"), validate(hostelIdSchema), roomController.listRoomsForHostel);
router.get("/:id", authorize("hostel:read"), validate(getRoomSchema), roomController.getRoom);
router.patch("/:id", authorize("hostel:update"), validate(updateRoomSchema), roomController.updateRoom);
router.delete("/:id", authorize("hostel:delete"), validate(getRoomSchema), roomController.deleteRoom);

export default router;
