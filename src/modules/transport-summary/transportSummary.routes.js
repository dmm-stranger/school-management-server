import { Router } from "express";
import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import { getTransportSummary } from "./transportSummary.service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  authorize("transport:create"),
  asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, await getTransportSummary(), "Transport summary fetched."));
  })
);

export default router;
