import { Router } from "express";
import * as settingController from "./librarySetting.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateLibrarySettingsSchema } from "./librarySetting.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("library:read"), settingController.getSettings);
// Per BACKEND-WORKING-FLOW §15: only SUPER_ADMIN may modify settings (ADMIN has no settings:* keys).
router.patch("/", authorize("settings:update"), validate(updateLibrarySettingsSchema), settingController.updateSettings);

export default router;
