import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as routeService from "./transportRoute.service.js";

export const createRoute = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await routeService.createRoute(req.body, req.user._id), "Route created."));
});
export const listRoutes = asyncHandler(async (req, res) => {
  const result = await routeService.listRoutes({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    search: req.query.search,
    status: req.query.status,
    vehicleId: req.query.vehicleId,
  });
  res.status(200).json(new ApiResponse(200, result, "Routes fetched."));
});
export const getRoute = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await routeService.getRouteById(req.params.id), "Route fetched."));
});
export const updateRoute = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await routeService.updateRoute(req.params.id, req.body), "Route updated."));
});
export const deleteRoute = asyncHandler(async (req, res) => {
  await routeService.deleteRoute(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Route deleted."));
});
