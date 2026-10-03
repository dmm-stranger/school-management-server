import { Router } from "express";
import * as bookController from "./book.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createBookSchema, updateBookSchema, getBookSchema } from "./book.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(createBookSchema), bookController.createBook);
// Catalog browsing is open to anyone with library:list (students, teachers, staff get this key too).
router.get("/", authorize("library:list"), bookController.listBooks);
router.get("/:id", authorize("library:read"), validate(getBookSchema), bookController.getBook);
router.patch("/:id", authorize("library:update"), validate(updateBookSchema), bookController.updateBook);
router.delete("/:id", authorize("library:delete"), validate(getBookSchema), bookController.deleteBook);

export default router;
