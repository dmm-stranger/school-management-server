import { Router } from "express";
import { bookCategoryController as controller } from "./bookCategory.crud.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createBookCategorySchema, updateBookCategorySchema, getBookCategorySchema } from "./bookCategory.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(createBookCategorySchema), controller.create);
router.get("/", authorize("library:list"), controller.list);
router.get("/:id", authorize("library:read"), validate(getBookCategorySchema), controller.getById);
router.patch("/:id", authorize("library:update"), validate(updateBookCategorySchema), controller.update);
router.delete("/:id", authorize("library:delete"), validate(getBookCategorySchema), controller.remove);

export default router;
