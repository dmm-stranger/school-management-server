import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as settingService from "./librarySetting.service.js";

export const getSettings = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await settingService.getLibrarySettings(), "Library settings fetched."));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateLibrarySettings(req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, settings, "Library settings updated."));
});
