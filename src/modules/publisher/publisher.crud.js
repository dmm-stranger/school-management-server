import Publisher from "./publisher.model.js";
import Book from "../book/book.model.js";
import { createLookupCrud } from "../../shared/lookupCrud.js";

export const { service: publisherService, controller: publisherController } = createLookupCrud({
  Model: Publisher,
  label: "Publisher",
  countInUse: (id) => Book.countDocuments({ publisherId: id, isDeleted: false }),
});
