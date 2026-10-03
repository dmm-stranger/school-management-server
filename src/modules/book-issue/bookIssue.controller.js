import asyncHandler from "../../shared/asyncHandler.js";
import ApiResponse from "../../shared/ApiResponse.js";
import * as issueService from "./bookIssue.service.js";
import { isLibraryManager } from "../../utils/libraryAccess.util.js";

const paging = (query) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Number(query.limit) || 20),
});

export const issueBook = asyncHandler(async (req, res) => {
  const issue = await issueService.issueBook(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, issue, "Book issued."));
});

export const returnBook = asyncHandler(async (req, res) => {
  const result = await issueService.returnBook(req.params.id, req.body, req.user._id);
  const message = result.fines.length ? "Book returned. A fine was recorded." : "Book returned.";
  res.status(200).json(new ApiResponse(200, result, message));
});

export const renewBook = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await issueService.renewBook(req.params.id), "Loan renewed."));
});

const listWith = (forced = {}) =>
  asyncHandler(async (req, res) => {
    // Non-managers can only ever see their own records, whatever query they send.
    const scopedBorrower = isLibraryManager(req.user) ? req.query.borrowerId : String(req.user._id);
    const result = await issueService.listIssues({
      ...paging(req.query),
      status: req.query.status,
      overdue: forced.overdue ?? req.query.overdue === "true",
      borrowerId: scopedBorrower,
      bookId: req.query.bookId,
      search: req.query.search,
      from: req.query.from,
      to: req.query.to,
      sort: req.query.sort,
    });
    res.status(200).json(new ApiResponse(200, result, "Issues fetched."));
  });

export const listIssues = listWith();
export const listOverdue = listWith({ overdue: true });

export const listMyIssues = asyncHandler(async (req, res) => {
  const result = await issueService.listIssues({
    ...paging(req.query),
    status: req.query.status,
    borrowerId: String(req.user._id),
    sort: req.query.sort,
  });
  res.status(200).json(new ApiResponse(200, result, "Your library records fetched."));
});

export const getIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.params.id, {
    userId: req.user._id,
    isManager: isLibraryManager(req.user),
  });
  res.status(200).json(new ApiResponse(200, issue, "Issue fetched."));
});

export const searchBorrowers = asyncHandler(async (req, res) => {
  const results = await issueService.searchBorrowers({ search: req.query.search, type: req.query.type });
  res.status(200).json(new ApiResponse(200, results, "Borrowers fetched."));
});

export const getBorrowerStatus = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, await issueService.getBorrowerStatus(req.params.userId), "Borrower status fetched."));
});
