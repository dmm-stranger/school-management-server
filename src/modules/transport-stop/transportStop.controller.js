import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as stopService from "./transportStop.service.js";

export const createStop = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await stopService.createStop(req.body), "Stop added."));
});
export const listStopsForRoute = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await stopService.listStopsForRoute(req.params.routeId), "Stops fetched."));
});
export const getStop = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await stopService.getStopById(req.params.id), "Stop fetched."));
});
export const updateStop = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await stopService.updateStop(req.params.id, req.body), "Stop updated."));
});
export const deleteStop = asyncHandler(async (req, res) => {
  await stopService.deleteStop(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Stop removed."));
});
export const reorderStops = asyncHandler(async (req, res) => {
  const stops = await stopService.reorderStops(req.params.routeId, req.body.stops);
  res.status(200).json(new ApiResponse(200, stops, "Stops reordered."));
});
