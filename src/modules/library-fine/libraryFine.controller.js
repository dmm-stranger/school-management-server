import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as fineService from "./libraryFine.service.js";
import { isLibraryManager } from "../../utils/libraryAccess.util.js";

export const listFines = asyncHandler(async (req, res) => {
  const result = await fineService.listFines({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Number(req.query.limit) || 20),
    status: req.query.status,
    reason: req.query.reason,
    // Non-managers are pinned to their own fines regardless of the query string.
    borrowerId: isLibraryManager(req.user) ? req.query.borrowerId : String(req.user._id),
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Fines fetched."));
});

export const getFine = asyncHandler(async (req, res) => {
  const fine = await fineService.getFineById(req.params.id, {
    userId: req.user._id,
    isManager: isLibraryManager(req.user),
  });
  res.status(200).json(new ApiResponse(200, fine, "Fine fetched."));
});

export const payFine = asyncHandler(async (req, res) => {
  const fine = await fineService.payFine(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, fine, "Fine paid. Receipt issued."));
});

export const waiveFine = asyncHandler(async (req, res) => {
  const fine = await fineService.waiveFine(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, fine, "Fine waived."));
});
