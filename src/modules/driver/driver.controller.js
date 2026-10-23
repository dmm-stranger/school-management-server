import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as driverService from "./driver.service.js";

export const createDriver = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await driverService.createDriver(req.body, req.user._id), "Driver added."));
});
export const listDrivers = asyncHandler(async (req, res) => {
  const result = await driverService.listDrivers({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    search: req.query.search,
    status: req.query.status,
  });
  res.status(200).json(new ApiResponse(200, result, "Drivers fetched."));
});
export const getDriver = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await driverService.getDriverById(req.params.id), "Driver fetched."));
});
export const updateDriver = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await driverService.updateDriver(req.params.id, req.body), "Driver updated."));
});
export const deleteDriver = asyncHandler(async (req, res) => {
  await driverService.deleteDriver(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Driver deleted."));
});
