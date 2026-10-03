import { Router } from "express";
import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import { getLibrarySummary } from "./librarySummary.service.js";

const router = Router();

router.use(authenticate);

// library:create = manager-level (Librarian/Admin). Members never see school-wide numbers.
router.get(
  "/",
  authorize("library:create"),
  asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, await getLibrarySummary(), "Library summary fetched."));
  })
);

export default router;
