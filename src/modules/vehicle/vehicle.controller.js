import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as vehicleService from "./vehicle.service.js";

export const createVehicle = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await vehicleService.createVehicle(req.body, req.user._id), "Vehicle added."));
});
export const listVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.listVehicles({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    search: req.query.search,
    status: req.query.status,
  });
  res.status(200).json(new ApiResponse(200, result, "Vehicles fetched."));
});
export const getVehicle = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await vehicleService.getVehicleById(req.params.id), "Vehicle fetched."));
});
export const updateVehicle = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await vehicleService.updateVehicle(req.params.id, req.body), "Vehicle updated."));
});
export const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Vehicle deleted."));
});
