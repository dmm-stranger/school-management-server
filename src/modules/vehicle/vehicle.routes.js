import { Router } from "express";
import * as vehicleController from "./vehicle.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createVehicleSchema, updateVehicleSchema, getVehicleSchema } from "./vehicle.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("transport:create"), validate(createVehicleSchema), vehicleController.createVehicle);
router.get("/", authorize("transport:list"), vehicleController.listVehicles);
router.get("/:id", authorize("transport:read"), validate(getVehicleSchema), vehicleController.getVehicle);
router.patch("/:id", authorize("transport:update"), validate(updateVehicleSchema), vehicleController.updateVehicle);
router.delete("/:id", authorize("transport:delete"), validate(getVehicleSchema), vehicleController.deleteVehicle);

export default router;
