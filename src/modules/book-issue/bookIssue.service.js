import mongoose from "mongoose";
import BookIssue, { BORROWER_TYPES } from "./bookIssue.model.js";
import BookCopy from "../book-copy/bookCopy.model.js";
import LibraryFine from "../library-fine/libraryFine.model.js";
import Book from "../book/book.model.js";
import User from "../user/user.model.js";
import Student from "../student/student.model.js";
import Teacher from "../teacher/teacher.model.js";
import Staff from "../staff/staff.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { getLibrarySettings } from "../library-setting/librarySetting.service.js";
import {
  computeDueDate,
  computeOverdueDays,
  computeOverdueFine,
  computeLostPenalty,
} from "../../utils/library.util.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PROFILE_MODELS = { STUDENT: Student, TEACHER: Teacher, STAFF: Staff };

/** Adds the derived fields the UI needs. `settings` is fetched once per request, not per row. */
export const withIssueView = (issue, settings, asOf = new Date()) => {
  const plain = typeof issue.toObject === "function" ? issue.toObject() : issue;
  const overdueDays = plain.status === "ISSUED" ? computeOverdueDays(plain.dueDate, asOf) : 0;
  return {
    ...plain,
    isOverdue: overdueDays > 0,
    overdueDays,
    projectedFine:
      overdueDays > 0 ? computeOverdueFine(overdueDays, settings.finePerDay, settings.maxFinePerIssue) : 0,
  };
};

/* ------------------------------------------------------------------ */
/* Borrowers                                                           */
/* ------------------------------------------------------------------ */

const resolveBorrower = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw ApiError.badRequest("Borrower account not found.");
  // PENDING_VERIFICATION is allowed: it only means the portal email isn't verified yet. A newly admitted
  // student holds a physical library card and must still be able to borrow at the desk.
  if (["INACTIVE", "SUSPENDED", "BLOCKED"].includes(user.accountStatus)) {
    throw ApiError.badRequest(`Borrower's account is ${user.accountStatus.toLowerCase()}.`);
  }
  if (!BORROWER_TYPES.includes(user.profileType) || !user.profileId) {
    throw ApiError.badRequest("Only students, teachers and staff can borrow books.");
  }

  const profile = await PROFILE_MODELS[user.profileType].findById(user.profileId);
  if (!profile) throw ApiError.badRequest("Borrower profile not found.");

  return {
    user,
    type: user.profileType,
    snapshot: {
      name: profile.personalInfo.fullName,
      code: profile.studentId || profile.employeeId || null,
      profileId: profile._id,
    },
  };
};

/**
 * Single source of truth for "may this person borrow right now?" — used by
 * the issue desk UI (to show the reasons up front) AND by issueBook (which
 * enforces them), so the two can never disagree.
 */
export const getBorrowerStatus = async (userId, settings = null) => {
  const cfg = settings || (await getLibrarySettings());
  const { type, snapshot } = await resolveBorrower(userId);
  const limit = cfg.borrowLimits[type];
  const now = new Date();

  const [activeCount, overdueCount, pendingFines] = await Promise.all([
    BookIssue.countDocuments({ borrowerId: userId, status: "ISSUED" }),
    BookIssue.countDocuments({ borrowerId: userId, status: "ISSUED", dueDate: { $lt: now } }),
    LibraryFine.aggregate([
      { $match: { borrowerId: new mongoose.Types.ObjectId(String(userId)), status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const pending = pendingFines[0] || { total: 0, count: 0 };
  const reasons = [];
  if (activeCount >= limit.maxBooks) {
    reasons.push(`Borrow limit reached (${activeCount}/${limit.maxBooks} books).`);
  }
  if (cfg.blockIssueWithPendingFines && overdueCount > 0) {
    reasons.push(`${overdueCount} overdue book(s) must be returned first.`);
  }
  if (cfg.blockIssueWithPendingFines && pending.count > 0) {
    reasons.push(`Unpaid library fines of ${pending.total} must be settled first.`);
  }

  return {
    userId,
    borrowerType: type,
    borrower: snapshot,
    maxBooks: limit.maxBooks,
    loanDays: limit.loanDays,
    activeCount,
    overdueCount,
    pendingFineTotal: pending.total,
    pendingFineCount: pending.count,
    canBorrow: reasons.length === 0,
    reasons,
  };
};

/** Desk lookup: find a borrower by name or ID across students, teachers and staff. */
export const searchBorrowers = async ({ search, type }) => {
  if (!search || search.trim().length < 2) return [];
  const rx = new RegExp(escapeRegex(search.trim()), "i");
  const types = type ? [type] : BORROWER_TYPES;

  const results = await Promise.all(
    types.map(async (t) => {
      const codeField = t === "STUDENT" ? "studentId" : "employeeId";
      const profiles = await PROFILE_MODELS[t]
        .find({ status: "ACTIVE", isDeleted: { $ne: true }, $or: [{ "personalInfo.fullName": rx }, { [codeField]: rx }] })
        .select(`userId personalInfo.fullName ${codeField}`)
        .limit(10)
        .lean();
      return profiles.map((p) => ({
        userId: p.userId,
        name: p.personalInfo.fullName,
        code: p[codeField],
        type: t,
      }));
    })
  );
  return results.flat().slice(0, 20);
};

/* ------------------------------------------------------------------ */
/* Issue                                                               */
/* ------------------------------------------------------------------ */

export const issueBook = async ({ barcode, borrowerId, remarks }, issuedBy) => {
  const copy = await BookCopy.findOne({ barcode: barcode.trim(), isDeleted: false });
  if (!copy) throw ApiError.notFound(`No copy found with barcode "${barcode}".`);

  const book = await Book.findOne({ _id: copy.bookId, isDeleted: false });
  if (!book || book.status !== "ACTIVE") throw ApiError.badRequest("This book is not available for lending.");

  if (copy.status !== "AVAILABLE") {
    throw ApiError.conflict(`This copy is not available (current status: ${copy.status}).`);
  }

  const settings = await getLibrarySettings();
  const status = await getBorrowerStatus(borrowerId, settings);
  if (!status.canBorrow) throw ApiError.conflict(status.reasons[0]);

  // A person can't hold two copies of the same title.
  const alreadyHolding = await BookIssue.exists({ borrowerId, bookId: book._id, status: "ISSUED" });
  if (alreadyHolding) throw ApiError.conflict("This borrower already has a copy of this book.");

  const issueDate = new Date();
  const dueDate = computeDueDate(issueDate, status.loanDays);

  const issue = await withTransaction(async (session) => {
    // Atomic claim: only flips if it is STILL available — closes the race between two desks
    // scanning the same copy at the same moment. (The partial unique index is the second guard.)
    const claimed = await BookCopy.findOneAndUpdate(
      { _id: copy._id, status: "AVAILABLE" },
      { $set: { status: "ISSUED" } },
      { session, new: true }
    );
    if (!claimed) throw ApiError.conflict("This copy was just issued to someone else.");

    const [created] = await BookIssue.create(
      [
        {
          bookId: book._id,
          copyId: copy._id,
          bookTitle: book.title,
          barcode: copy.barcode,
          borrowerId,
          borrowerType: status.borrowerType,
          borrower: status.borrower,
          issueDate,
          dueDate,
          issuedBy,
          remarks: remarks || null,
        },
      ],
      { session }
    );
    return created;
  });

  return withIssueView(issue, settings);
};

/* ------------------------------------------------------------------ */
/* Return                                                              */
/* ------------------------------------------------------------------ */

export const returnBook = async (id, { condition = "GOOD", damageFine = 0, remarks }, returnedTo) => {
  const issue = await BookIssue.findById(id);
  if (!issue) throw ApiError.notFound("Issue record not found.");
  if (issue.status !== "ISSUED") throw ApiError.conflict("This book has already been returned.");

  const settings = await getLibrarySettings();
  const book = await Book.findById(issue.bookId); // soft-deleted books are still found — history must resolve
  const now = new Date();

  const daysOverdue = computeOverdueDays(issue.dueDate, now);
  const overdueFine = computeOverdueFine(daysOverdue, settings.finePerDay, settings.maxFinePerIssue);

  const fineDrafts = [];
  if (overdueFine > 0) fineDrafts.push({ reason: "OVERDUE", amount: overdueFine, daysOverdue });
  if (condition === "LOST") {
    const penalty = computeLostPenalty({
      price: book?.price,
      usePrice: settings.lostBookUsePrice,
      flatFine: settings.lostBookFlatFine,
    });
    if (penalty > 0) fineDrafts.push({ reason: "LOST", amount: penalty, daysOverdue: 0 });
  }
  if (condition === "DAMAGED" && damageFine > 0) {
    fineDrafts.push({ reason: "DAMAGED", amount: damageFine, daysOverdue: 0 });
  }

  const copyStatus = { GOOD: "AVAILABLE", DAMAGED: "DAMAGED", LOST: "LOST" }[condition];

  const { updated, fines } = await withTransaction(async (session) => {
    // Re-check inside the transaction so a double-click can't return (and fine) twice.
    const fresh = await BookIssue.findOneAndUpdate(
      { _id: issue._id, status: "ISSUED" },
      {
        $set: {
          status: condition === "LOST" ? "LOST" : "RETURNED",
          returnDate: now,
          returnCondition: condition,
          returnedTo,
          fineAmount: fineDrafts.reduce((sum, f) => sum + f.amount, 0),
          ...(remarks ? { remarks } : {}),
        },
      },
      { session, new: true }
    );
    if (!fresh) throw ApiError.conflict("This book has already been returned.");

    await BookCopy.updateOne({ _id: issue.copyId }, { $set: { status: copyStatus } }, { session });

    const fines = fineDrafts.length
      ? await LibraryFine.create(
          fineDrafts.map((f) => ({
            ...f,
            issueId: issue._id,
            borrowerId: issue.borrowerId,
            borrowerProfileId: issue.borrower.profileId,
            borrowerName: issue.borrower.name,
            bookTitle: issue.bookTitle,
          })),
          { session, ordered: true }
        )
      : [];

    return { updated: fresh, fines };
  });

  return { issue: withIssueView(updated, settings), fines };
};

/* ------------------------------------------------------------------ */
/* Renew                                                               */
/* ------------------------------------------------------------------ */

export const renewBook = async (id) => {
  const issue = await BookIssue.findById(id);
  if (!issue) throw ApiError.notFound("Issue record not found.");
  if (issue.status !== "ISSUED") throw ApiError.conflict("Only a book that is currently issued can be renewed.");

  const settings = await getLibrarySettings();
  if (computeOverdueDays(issue.dueDate) > 0) {
    throw ApiError.conflict("Overdue books can't be renewed. Return the book and settle any fine first.");
  }
  if (issue.renewalCount >= settings.maxRenewals) {
    throw ApiError.conflict(`Renewal limit reached (${settings.maxRenewals}).`);
  }

  const loanDays = settings.borrowLimits[issue.borrowerType].loanDays;
  issue.dueDate = computeDueDate(issue.dueDate, loanDays); // extends from the current due date, not from today
  issue.renewalCount += 1;
  await issue.save();
  return withIssueView(issue, settings);
};

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

export const listIssues = async ({ page, limit, status, overdue, borrowerId, bookId, search, from, to, sort }) => {
  const filter = {};
  const now = new Date();

  if (status) filter.status = status;
  if (overdue) {
    filter.status = "ISSUED";
    filter.dueDate = { $lt: now };
  }
  if (borrowerId) filter.borrowerId = borrowerId;
  if (bookId) filter.bookId = bookId;
  if (from || to) {
    filter.issueDate = {};
    if (from) filter.issueDate.$gte = new Date(from);
    if (to) filter.issueDate.$lte = new Date(to);
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ bookTitle: rx }, { barcode: rx }, { "borrower.name": rx }, { "borrower.code": rx }];
  }

  const [settings, issues, total] = await Promise.all([
    getLibrarySettings(),
    BookIssue.find(filter)
      .sort(sort || (overdue ? "dueDate" : "-issueDate"))
      .skip((page - 1) * limit)
      .limit(limit),
    BookIssue.countDocuments(filter),
  ]);

  return {
    data: issues.map((i) => withIssueView(i, settings, now)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getIssueById = async (id, { userId, isManager }) => {
  const issue = await BookIssue.findById(id);
  if (!issue) throw ApiError.notFound("Issue record not found.");
  if (!isManager && String(issue.borrowerId) !== String(userId)) {
    throw ApiError.forbidden("You can only view your own library records.");
  }
  return withIssueView(issue, await getLibrarySettings());
};
