import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as allocationService from "./hostelAllocation.service.js";
import * as feeService from "../hostel-fee/hostelFee.service.js";
import Student from "../student/student.model.js";
import ApiError from "../../shared/ApiError.js";

export const createAllocation = asyncHandler(async (req, res) => {
  const allocation = await allocationService.createAllocation(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, allocation, "Student allocated to hostel. Fee generated."));
});

export const listAllocations = asyncHandler(async (req, res) => {
  const result = await allocationService.listAllocations({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    status: req.query.status,
    hostelId: req.query.hostelId,
    roomId: req.query.roomId,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Allocations fetched."));
});

export const getAllocation = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await allocationService.getAllocationById(req.params.id), "Allocation fetched."));
});

export const endAllocation = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await allocationService.endAllocation(req.params.id, req.body, req.user._id), "Allocation ended."));
});

/** Self-service: "my hostel" for the logged-in student. */
export const getMyAllocation = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id, isDeleted: false });
  if (!student) throw ApiError.badRequest("No student profile is linked to this account.");

  const [allocation, fees] = await Promise.all([
    allocationService.getActiveAllocationForStudent(student._id).catch(() => null),
    feeService.listFeesForStudent(student._id),
  ]);
  res.status(200).json(new ApiResponse(200, { allocation, fees }, "Your hostel details fetched."));
});
