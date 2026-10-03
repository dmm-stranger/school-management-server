import BookCopy, { MANUAL_COPY_STATUSES } from "./bookCopy.model.js";
import Book from "../book/book.model.js";
import ApiError from "../../shared/ApiError.js";
import { generateBookBarcode } from "../../utils/idGenerator.util.js";

/** Creates `count` individually-barcoded copies of a book. Accepts an optional session so Book creation can be atomic. */
export const createCopies = async ({ bookId, count, acquiredDate, notes }, userId, session = null) => {
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    docs.push({
      bookId,
      barcode: await generateBookBarcode(),
      acquiredDate: acquiredDate || new Date(),
      notes: notes || null,
      createdBy: userId,
    });
  }
  return BookCopy.create(docs, session ? { session } : undefined);
};

export const addCopiesToBook = async (payload, userId) => {
  const book = await Book.findOne({ _id: payload.bookId, isDeleted: false });
  if (!book) throw ApiError.notFound("Book not found.");
  if (book.status !== "ACTIVE") throw ApiError.badRequest("Cannot add copies to an inactive book.");
  return createCopies(payload, userId);
};

export const listCopies = async ({ page, limit, bookId, status, search }) => {
  const filter = { isDeleted: false };
  if (bookId) filter.bookId = bookId;
  if (status) filter.status = status;
  if (search) filter.barcode = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [data, total] = await Promise.all([
    BookCopy.find(filter)
      .populate("bookId", "title isbn")
      .sort("barcode")
      .skip((page - 1) * limit)
      .limit(limit),
    BookCopy.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

/** Used by the issue desk: scan a barcode → get the copy + its book. */
export const getCopyByBarcode = async (barcode) => {
  const copy = await BookCopy.findOne({ barcode: barcode.trim(), isDeleted: false }).populate(
    "bookId",
    "title isbn shelfLocation price status"
  );
  if (!copy) throw ApiError.notFound(`No copy found with barcode "${barcode}".`);
  return copy;
};

export const getCopyById = async (id) => {
  const copy = await BookCopy.findOne({ _id: id, isDeleted: false }).populate("bookId", "title isbn");
  if (!copy) throw ApiError.notFound("Book copy not found.");
  return copy;
};

export const updateCopy = async (id, updates) => {
  const copy = await BookCopy.findOne({ _id: id, isDeleted: false });
  if (!copy) throw ApiError.notFound("Book copy not found.");

  if (updates.status && updates.status !== copy.status) {
    if (copy.status === "ISSUED") {
      throw ApiError.conflict("This copy is currently issued. Return it before changing its status.");
    }
    if (!MANUAL_COPY_STATUSES.includes(updates.status)) {
      throw ApiError.badRequest("A copy can only become ISSUED through the issue flow.");
    }
  }

  Object.assign(copy, updates);
  await copy.save();
  return copy;
};

/** Soft delete — a copy with borrowing history is never physically removed. */
export const deleteCopy = async (id) => {
  const copy = await BookCopy.findOne({ _id: id, isDeleted: false });
  if (!copy) throw ApiError.notFound("Book copy not found.");
  if (copy.status === "ISSUED") {
    throw ApiError.conflict("This copy is currently issued. Return it before removing it.");
  }
  copy.isDeleted = true;
  copy.status = "RETIRED";
  await copy.save();
};
