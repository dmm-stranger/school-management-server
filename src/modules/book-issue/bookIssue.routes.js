import { Router } from "express";
import * as issueController from "./bookIssue.controller.js";
import authenticate from "../../middlewares/authenticate.middleware.js";
import authorize from "../../middlewares/authorize.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  issueBookSchema,
  returnBookSchema,
  issueIdSchema,
  borrowerStatusSchema,
  listIssuesSchema,
  searchBorrowersSchema,
} from "./bookIssue.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("library:create"), validate(issueBookSchema), issueController.issueBook);
router.get("/", authorize("library:list"), validate(listIssuesSchema), issueController.listIssues);

// Static routes BEFORE /:id so they aren't swallowed as an id param.
router.get("/my", authorize("library:read"), issueController.listMyIssues);
router.get("/overdue", authorize("library:list"), validate(listIssuesSchema), issueController.listOverdue);
router.get("/borrowers/search", authorize("library:create"), validate(searchBorrowersSchema), issueController.searchBorrowers);
router.get("/borrowers/:userId/status", authorize("library:create"), validate(borrowerStatusSchema), issueController.getBorrowerStatus);

router.get("/:id", authorize("library:read"), validate(issueIdSchema), issueController.getIssue);
router.post("/:id/return", authorize("library:update"), validate(returnBookSchema), issueController.returnBook);
router.post("/:id/renew", authorize("library:update"), validate(issueIdSchema), issueController.renewBook);

export default router;
