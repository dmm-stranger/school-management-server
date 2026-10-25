import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as bedService from "./hostelBed.service.js";

export const createBeds = asyncHandler(async (req, res) => {
  const beds = await bedService.createBeds(req.body);
  res.status(201).json(new ApiResponse(201, beds, `${beds.length} bed(s) added.`));
});
export const listBedsForRoom = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await bedService.listBedsForRoom(req.params.roomId), "Beds fetched."));
});
export const getBed = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await bedService.getBedById(req.params.id), "Bed fetched."));
});
export const updateBed = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await bedService.updateBed(req.params.id, req.body), "Bed updated."));
});
export const deleteBed = asyncHandler(async (req, res) => {
  await bedService.deleteBed(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Bed removed."));
});
