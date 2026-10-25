import { Router } from "express";
import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import { getHostelSummary } from "./hostelSummary.service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  authorize("hostel:create"),
  asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, await getHostelSummary(), "Hostel summary fetched."));
  })
);

export default router;
