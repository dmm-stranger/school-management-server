import LibraryFine from "./libraryFine.model.js";
import Transaction from "../transaction/transaction.model.js";
import Receipt from "../receipt/receipt.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { generateReceiptNumber } from "../../utils/idGenerator.util.js";

export const listFines = async ({ page, limit, status, reason, borrowerId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (reason) filter.reason = reason;
  if (borrowerId) filter.borrowerId = borrowerId;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ borrowerName: rx }, { bookTitle: rx }];
  }

  const [data, total, pendingAgg] = await Promise.all([
    LibraryFine.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    LibraryFine.countDocuments(filter),
    LibraryFine.aggregate([
      { $match: { ...filter, status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    pendingTotal: pendingAgg[0]?.total || 0,
  };
};

export const getFineById = async (id, { userId, isManager }) => {
  const fine = await LibraryFine.findById(id);
  if (!fine) throw ApiError.notFound("Fine not found.");
  if (!isManager && String(fine.borrowerId) !== String(userId)) {
    throw ApiError.forbidden("You can only view your own fines.");
  }
  return fine;
};

/**
 * Same atomic pattern as Finance (Phase 8): a successful payment always
 * creates the fine update + Transaction + Receipt together, or nothing.
 */
export const payFine = async (id, { paymentMethod }, receivedBy) => {
  const fine = await LibraryFine.findById(id);
  if (!fine) throw ApiError.notFound("Fine not found.");
  if (fine.status !== "PENDING") throw ApiError.conflict(`This fine is already ${fine.status.toLowerCase()}.`);

  return withTransaction(async (session) => {
    const paidAt = new Date();
    const receiptNumber = await generateReceiptNumber();

    // Guarded update — a double-submit can't pay the same fine twice.
    const updated = await LibraryFine.findOneAndUpdate(
      { _id: fine._id, status: "PENDING" },
      { $set: { status: "PAID", paidAt, paymentMethod, receiptNumber, receivedBy } },
      { session, new: true }
    );
    if (!updated) throw ApiError.conflict("This fine was just settled.");

    await Transaction.create(
      [
        {
          referenceType: "LIBRARY_FINE",
          referenceId: fine._id,
          transactionType: "INCOME",
          amount: fine.amount,
          transactionDate: paidAt,
        },
      ],
      { session }
    );

    await Receipt.create(
      [
        {
          receiptNumber,
          referenceType: "LIBRARY_FINE",
          referenceId: fine._id,
          amount: fine.amount,
          issuedTo: fine.borrowerProfileId,
          issuedDate: paidAt,
        },
      ],
      { session }
    );

    return updated;
  });
};

/** Waiving is a recorded decision (who + why), not a deletion — financial-style records are never removed. */
export const waiveFine = async (id, { reason }, waivedBy) => {
  const fine = await LibraryFine.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    { $set: { status: "WAIVED", waivedBy, waivedAt: new Date(), waiveReason: reason } },
    { new: true }
  );
  if (!fine) {
    const exists = await LibraryFine.exists({ _id: id });
    if (!exists) throw ApiError.notFound("Fine not found.");
    throw ApiError.conflict("Only a pending fine can be waived.");
  }
  return fine;
};
