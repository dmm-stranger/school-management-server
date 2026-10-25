import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as hostelService from "./hostel.service.js";

export const createHostel = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await hostelService.createHostel(req.body, req.user._id), "Hostel created."));
});
export const listHostels = asyncHandler(async (req, res) => {
  const result = await hostelService.listHostels({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    search: req.query.search,
    status: req.query.status,
    type: req.query.type,
  });
  res.status(200).json(new ApiResponse(200, result, "Hostels fetched."));
});
export const getHostel = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await hostelService.getHostelById(req.params.id), "Hostel fetched."));
});
export const updateHostel = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await hostelService.updateHostel(req.params.id, req.body), "Hostel updated."));
});
export const deleteHostel = asyncHandler(async (req, res) => {
  await hostelService.deleteHostel(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Hostel deleted."));
});
