import Author from "./author.model.js";
import Book from "../book/book.model.js";
import { createLookupCrud } from "../../shared/lookupCrud.js";

export const { service: authorService, controller: authorController } = createLookupCrud({
  Model: Author,
  label: "Author",
  countInUse: (id) => Book.countDocuments({ authorIds: id, isDeleted: false }),
});
