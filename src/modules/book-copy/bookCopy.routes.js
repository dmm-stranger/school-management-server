import { Router } from "express";
import * as copyController from "./bookCopy.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createCopiesSchema,
  updateCopySchema,
  getCopySchema,
  barcodeSchema,
  listCopiesSchema,
} from "./bookCopy.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(createCopiesSchema), copyController.createCopies);
router.get("/", authorize("library:create"), validate(listCopiesSchema), copyController.listCopies);
// Static route BEFORE /:id so "barcode" is never swallowed as an id param.
router.get("/barcode/:barcode", authorize("library:create"), validate(barcodeSchema), copyController.getCopyByBarcode);
router.get("/:id", authorize("library:create"), validate(getCopySchema), copyController.getCopy);
router.patch("/:id", authorize("library:update"), validate(updateCopySchema), copyController.updateCopy);
router.delete("/:id", authorize("library:delete"), validate(getCopySchema), copyController.deleteCopy);

export default router;
