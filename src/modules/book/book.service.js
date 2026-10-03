import Book from "./book.model.js";
import BookCopy from "../book-copy/bookCopy.model.js";
import BookCategory from "../book-category/bookCategory.model.js";
import Author from "../author/author.model.js";
import Publisher from "../publisher/publisher.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { createCopies } from "../book-copy/bookCopy.service.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Referenced category/authors/publisher must exist (business validation, before the DB unique checks). */
const assertReferencesExist = async ({ categoryId, authorIds, publisherId }) => {
  if (categoryId) {
    const category = await BookCategory.findOne({ _id: categoryId, isDeleted: false });
    if (!category) throw ApiError.badRequest("Book category not found.");
  }
  if (authorIds) {
    const count = await Author.countDocuments({ _id: { $in: authorIds }, isDeleted: false });
    if (count !== new Set(authorIds.map(String)).size) throw ApiError.badRequest("One or more authors were not found.");
  }
  if (publisherId) {
    const publisher = await Publisher.findOne({ _id: publisherId, isDeleted: false });
    if (!publisher) throw ApiError.badRequest("Publisher not found.");
  }
};

const assertIsbnFree = async (isbn, ignoreId) => {
  if (!isbn) return;
  const existing = await Book.findOne({ isbn, isDeleted: false, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
  if (existing) throw ApiError.conflict(`A book with ISBN ${isbn} already exists ("${existing.title}").`);
};

export const createBook = async ({ initialCopies = 0, ...payload }, userId) => {
  await assertReferencesExist(payload);
  await assertIsbnFree(payload.isbn);

  // Book + its first copies are created together or not at all.
  return withTransaction(async (session) => {
    const [book] = await Book.create([{ ...payload, createdBy: userId }], { session });
    if (initialCopies > 0) {
      await createCopies({ bookId: book._id, count: initialCopies }, userId, session);
    }
    return book;
  });
};

/** { bookId: { total, available } } for a page of books — one aggregate, not N queries. */
const copyCountsFor = async (bookIds) => {
  const rows = await BookCopy.aggregate([
    { $match: { bookId: { $in: bookIds }, isDeleted: false, status: { $ne: "RETIRED" } } },
    {
      $group: {
        _id: "$bookId",
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { total: r.total, available: r.available }]));
};

const populateBook = (query) =>
  query
    .populate("categoryId", "name")
    .populate("authorIds", "name")
    .populate("publisherId", "name");

export const listBooks = async ({ page, limit, search, categoryId, authorId, publisherId, status, availableOnly, sort }) => {
  const filter = { isDeleted: false };
  if (categoryId) filter.categoryId = categoryId;
  if (authorId) filter.authorIds = authorId;
  if (publisherId) filter.publisherId = publisherId;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { subtitle: rx }, { isbn: rx }];
  }
  if (availableOnly) {
    const availableBookIds = await BookCopy.distinct("bookId", { status: "AVAILABLE", isDeleted: false });
    filter._id = { $in: availableBookIds };
  }

  const [books, total] = await Promise.all([
    populateBook(Book.find(filter))
      .sort(sort || "title")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Book.countDocuments(filter),
  ]);

  const counts = await copyCountsFor(books.map((b) => b._id));
  const data = books.map((b) => ({
    ...b,
    copies: counts.get(String(b._id)) || { total: 0, available: 0 },
  }));

  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getBookById = async (id) => {
  const book = await populateBook(Book.findOne({ _id: id, isDeleted: false })).lean();
  if (!book) throw ApiError.notFound("Book not found.");

  const copies = await BookCopy.find({ bookId: id, isDeleted: false }).sort("barcode").lean();
  const active = copies.filter((c) => c.status !== "RETIRED");
  return {
    ...book,
    copyList: copies,
    copies: { total: active.length, available: active.filter((c) => c.status === "AVAILABLE").length },
  };
};

export const updateBook = async (id, updates) => {
  const book = await Book.findOne({ _id: id, isDeleted: false });
  if (!book) throw ApiError.notFound("Book not found.");

  await assertReferencesExist(updates);
  if (updates.isbn && updates.isbn !== book.isbn) await assertIsbnFree(updates.isbn, id);

  Object.assign(book, updates);
  await book.save();
  return book;
};

/** Soft delete. Blocked while any copy is out; issue history (which snapshots title + barcode) is untouched. */
export const deleteBook = async (id) => {
  const book = await Book.findOne({ _id: id, isDeleted: false });
  if (!book) throw ApiError.notFound("Book not found.");

  const issued = await BookCopy.countDocuments({ bookId: id, status: "ISSUED", isDeleted: false });
  if (issued > 0) {
    throw ApiError.conflict(`${issued} copy/copies of this book are currently issued. Wait for them to be returned first.`);
  }

  await withTransaction(async (session) => {
    book.isDeleted = true;
    book.status = "INACTIVE";
    await book.save({ session });
    await BookCopy.updateMany(
      { bookId: id, isDeleted: false },
      { $set: { isDeleted: true, status: "RETIRED" } },
      { session }
    );
  });
};

