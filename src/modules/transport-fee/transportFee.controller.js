import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as feeService from "./transportFee.service.js";
import { isTransportManager } from "../../utils/transportAccess.util.js";

export const listTransportFees = asyncHandler(async (req, res) => {
  const result = await feeService.listTransportFees({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    status: req.query.status,
    studentId: isTransportManager(req.user) ? req.query.studentId : undefined,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Transport fees fetched."));
});

export const getTransportFee = asyncHandler(async (req, res) => {
  const fee = await feeService.getTransportFeeById(req.params.id, { userId: req.user._id, isManager: isTransportManager(req.user) });
  res.status(200).json(new ApiResponse(200, fee, "Transport fee fetched."));
});

export const payTransportFee = asyncHandler(async (req, res) => {
  const fee = await feeService.payTransportFee(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, fee, fee.status === "PAID" ? "Fee paid in full. Receipt issued." : "Partial payment recorded. Receipt issued."));
});
