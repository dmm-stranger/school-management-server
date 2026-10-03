import BookCategory from "./bookCategory.model.js";
import Book from "../book/book.model.js";
import { createLookupCrud } from "../../shared/lookupCrud.js";

export const { service: bookCategoryService, controller: bookCategoryController } = createLookupCrud({
  Model: BookCategory,
  label: "Book category",
  countInUse: (id) => Book.countDocuments({ categoryId: id, isDeleted: false }),
});
