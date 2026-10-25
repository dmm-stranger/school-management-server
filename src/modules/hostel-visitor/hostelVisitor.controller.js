import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as visitorService from "./hostelVisitor.service.js";

export const logVisitor = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await visitorService.logVisitor(req.body, req.user._id), "Visitor logged."));
});
export const listVisitors = asyncHandler(async (req, res) => {
  const result = await visitorService.listVisitors({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    studentId: req.query.studentId,
    hostelId: req.query.hostelId,
    activeOnly: req.query.activeOnly === "true",
  });
  res.status(200).json(new ApiResponse(200, result, "Visitor log fetched."));
});
export const checkOutVisitor = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await visitorService.checkOutVisitor(req.params.id), "Visitor checked out."));
});
