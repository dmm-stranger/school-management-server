import { Router } from "express";
import * as routeController from "./transportRoute.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createRouteSchema, updateRouteSchema, getRouteSchema } from "./transportRoute.validation.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("transport:create"), validate(createRouteSchema), routeController.createRoute);
// Browsing routes is open to anyone with transport:list (students/parents checking which route serves them).
router.get("/", authorize("transport:list"), routeController.listRoutes);
router.get("/:id", authorize("transport:read"), validate(getRouteSchema), routeController.getRoute);
router.patch("/:id", authorize("transport:update"), validate(updateRouteSchema), routeController.updateRoute);
router.delete("/:id", authorize("transport:delete"), validate(getRouteSchema), routeController.deleteRoute);

export default router;
