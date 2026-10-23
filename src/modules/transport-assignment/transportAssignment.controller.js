import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as assignmentService from "./transportAssignment.service.js";
import * as feeService from "../transport-fee/transportFee.service.js";
import Student from "../student/student.model.js";
import ApiError from "../../shared/ApiError.js";

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.createAssignment(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, assignment, "Student assigned to transport. Fee generated."));
});

export const listAssignments = asyncHandler(async (req, res) => {
  const result = await assignmentService.listAssignments({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    status: req.query.status,
    vehicleId: req.query.vehicleId,
    routeId: req.query.routeId,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Assignments fetched."));
});

export const getAssignment = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await assignmentService.getAssignmentById(req.params.id), "Assignment fetched."));
});

export const endAssignment = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await assignmentService.endAssignment(req.params.id, req.body, req.user._id), "Assignment ended."));
});

/** Self-service: "my transport" for the logged-in student. */
export const getMyAssignment = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id, isDeleted: false });
  if (!student) throw ApiError.badRequest("No student profile is linked to this account.");

  const [assignment, fees] = await Promise.all([
    assignmentService.getActiveAssignmentForStudent(student._id).catch(() => null),
    feeService.listFeesForStudent(student._id),
  ]);
  res.status(200).json(new ApiResponse(200, { assignment, fees }, "Your transport details fetched."));
});
