import { Router } from "express";
import { publisherController as controller } from "./publisher.crud.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createPublisherSchema, updatePublisherSchema, getPublisherSchema } from "./publisher.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(createPublisherSchema), controller.create);
router.get("/", authorize("library:list"), controller.list);
router.get("/:id", authorize("library:read"), validate(getPublisherSchema), controller.getById);
router.patch("/:id", authorize("library:update"), validate(updatePublisherSchema), controller.update);
router.delete("/:id", authorize("library:delete"), validate(getPublisherSchema), controller.remove);

export default router;
