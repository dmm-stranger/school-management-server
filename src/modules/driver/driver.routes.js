import { Router } from "express";
import * as driverController from "./driver.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createDriverSchema, updateDriverSchema, getDriverSchema } from "./driver.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("transport:create"), validate(createDriverSchema), driverController.createDriver);
router.get("/", authorize("transport:list"), driverController.listDrivers);
router.get("/:id", authorize("transport:read"), validate(getDriverSchema), driverController.getDriver);
router.patch("/:id", authorize("transport:update"), validate(updateDriverSchema), driverController.updateDriver);
router.delete("/:id", authorize("transport:delete"), validate(getDriverSchema), driverController.deleteDriver);

export default router;
