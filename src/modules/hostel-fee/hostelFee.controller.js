import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as feeService from "./hostelFee.service.js";
import { isHostelManager } from "../../utils/hostelAccess.util.js";

export const listHostelFees = asyncHandler(async (req, res) => {
  const result = await feeService.listHostelFees({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    status: req.query.status,
    studentId: isHostelManager(req.user) ? req.query.studentId : undefined,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Hostel fees fetched."));
});

export const getHostelFee = asyncHandler(async (req, res) => {
  const fee = await feeService.getHostelFeeById(req.params.id, { userId: req.user._id, isManager: isHostelManager(req.user) });
  res.status(200).json(new ApiResponse(200, fee, "Hostel fee fetched."));
});

export const payHostelFee = asyncHandler(async (req, res) => {
  const fee = await feeService.payHostelFee(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, fee, fee.status === "PAID" ? "Fee paid in full. Receipt issued." : "Partial payment recorded. Receipt issued."));
});

export const adjustHostelFee = asyncHandler(async (req, res) => {
  const fee = await feeService.adjustHostelFee(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, fee, "Fee adjusted."));
});
