import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as roomService from "./hostelRoom.service.js";

export const createRoom = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await roomService.createRoom(req.body), "Room added."));
});
export const listRoomsForHostel = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await roomService.listRoomsForHostel(req.params.hostelId), "Rooms fetched."));
});
export const getRoom = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await roomService.getRoomById(req.params.id), "Room fetched."));
});
export const updateRoom = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await roomService.updateRoom(req.params.id, req.body), "Room updated."));
});
export const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Room removed."));
});
