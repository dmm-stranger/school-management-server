import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as copyService from "./bookCopy.service.js";

export const createCopies = asyncHandler(async (req, res) => {
  const copies = await copyService.addCopiesToBook(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, copies, `${copies.length} copy/copies added.`));
});

export const listCopies = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const result = await copyService.listCopies({
    page,
    limit,
    bookId: req.query.bookId,
    status: req.query.status,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, result, "Book copies fetched."));
});

export const getCopyByBarcode = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await copyService.getCopyByBarcode(req.params.barcode), "Book copy fetched."));
});

export const getCopy = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await copyService.getCopyById(req.params.id), "Book copy fetched."));
});

export const updateCopy = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await copyService.updateCopy(req.params.id, req.body), "Book copy updated."));
});

export const deleteCopy = asyncHandler(async (req, res) => {
  await copyService.deleteCopy(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Book copy removed."));
});
