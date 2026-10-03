import { Router } from "express";
import { authorController as controller } from "./author.crud.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createAuthorSchema, updateAuthorSchema, getAuthorSchema } from "./author.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(createAuthorSchema), controller.create);
router.get("/", authorize("library:list"), controller.list);
router.get("/:id", authorize("library:read"), validate(getAuthorSchema), controller.getById);
router.patch("/:id", authorize("library:update"), validate(updateAuthorSchema), controller.update);
router.delete("/:id", authorize("library:delete"), validate(getAuthorSchema), controller.remove);

export default router;
