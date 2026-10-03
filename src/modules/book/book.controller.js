import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as bookService from "./book.service.js";

export const createBook = asyncHandler(async (req, res) => {
  const book = await bookService.createBook(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, book, "Book created."));
});

export const listBooks = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const result = await bookService.listBooks({
    page,
    limit,
    search: req.query.search,
    categoryId: req.query.categoryId,
    authorId: req.query.authorId,
    publisherId: req.query.publisherId,
    status: req.query.status,
    availableOnly: req.query.availableOnly === "true",
    sort: req.query.sort,
  });
  res.status(200).json(new ApiResponse(200, result, "Books fetched."));
});

export const getBook = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await bookService.getBookById(req.params.id), "Book fetched."));
});

export const updateBook = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await bookService.updateBook(req.params.id, req.body), "Book updated."));
});

export const deleteBook = asyncHandler(async (req, res) => {
  await bookService.deleteBook(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Book deleted."));
});
