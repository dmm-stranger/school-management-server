import Book from "../book/book.model.js";
import BookCopy from "../book-copy/bookCopy.model.js";
import BookIssue from "../book-issue/bookIssue.model.js";
import LibraryFine from "../library-fine/libraryFine.model.js";

/**
 * Computed on read, never stored (same reasoning as attendance-summary in
 * Phase 7): a materialized counter drifts the moment a record is corrected.
 */
export const getLibrarySummary = async () => {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [titles, copyAgg, activeIssues, overdueIssues, issuedToday, returnedToday, fineAgg, topBooks] =
    await Promise.all([
      Book.countDocuments({ isDeleted: false, status: "ACTIVE" }),
      BookCopy.aggregate([
        { $match: { isDeleted: false, status: { $ne: "RETIRED" } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      BookIssue.countDocuments({ status: "ISSUED" }),
      BookIssue.countDocuments({ status: "ISSUED", dueDate: { $lt: now } }),
      BookIssue.countDocuments({ issueDate: { $gte: startOfToday } }),
      BookIssue.countDocuments({ returnDate: { $gte: startOfToday } }),
      LibraryFine.aggregate([
        { $match: { status: "PENDING" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      BookIssue.aggregate([
        { $match: { issueDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$bookId", title: { $first: "$bookTitle" }, issues: { $sum: 1 } } },
        { $sort: { issues: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const byStatus = Object.fromEntries(copyAgg.map((r) => [r._id, r.count]));
  const totalCopies = copyAgg.reduce((sum, r) => sum + r.count, 0);

  return {
    titles,
    totalCopies,
    availableCopies: byStatus.AVAILABLE || 0,
    issuedCopies: byStatus.ISSUED || 0,
    unavailableCopies: (byStatus.LOST || 0) + (byStatus.DAMAGED || 0) + (byStatus.MAINTENANCE || 0),
    activeIssues,
    overdueIssues,
    issuedToday,
    returnedToday,
    pendingFineTotal: fineAgg[0]?.total || 0,
    pendingFineCount: fineAgg[0]?.count || 0,
    mostBorrowed: topBooks.map((b) => ({ bookId: b._id, title: b.title, issues: b.issues })),
  };
};
