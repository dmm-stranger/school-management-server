import assert from "node:assert/strict";
import { test } from "node:test";
import {
  endOfDayUTC, addDays, computeDueDate, computeOverdueDays, computeOverdueFine, computeLostPenalty,
} from "../src/utils/library.util.js";
import { createBookSchema } from "../src/modules/book/book.validation.js";
import { issueBookSchema, returnBookSchema } from "../src/modules/book-issue/bookIssue.validation.js";
import { updateLibrarySettingsSchema } from "../src/modules/library-setting/librarySetting.validation.js";
import { payFineSchema, waiveFineSchema } from "../src/modules/library-fine/libraryFine.validation.js";
import { createCopiesSchema } from "../src/modules/book-copy/bookCopy.validation.js";
import { withIssueView } from "../src/modules/book-issue/bookIssue.service.js";

const oid = "64f1a2b3c4d5e6f7a8b9c0d1";
const settings = { finePerDay: 5, maxFinePerIssue: null };

test("due date is end of the last day (UTC), not start", () => {
  const due = computeDueDate(new Date("2026-09-01T10:00:00Z"), 14);
  assert.equal(due.toISOString(), "2026-09-15T23:59:59.999Z");
});

test("returning on the due day is NOT overdue; 1 ms later is 1 day", () => {
  const due = endOfDayUTC(new Date("2026-09-15T00:00:00Z"));
  assert.equal(computeOverdueDays(due, new Date("2026-09-15T23:59:59.999Z")), 0);
  assert.equal(computeOverdueDays(due, new Date("2026-09-16T00:00:00.000Z")), 1);
  assert.equal(computeOverdueDays(due, new Date("2026-09-16T12:00:00Z")), 1);
  assert.equal(computeOverdueDays(due, new Date("2026-09-17T00:00:00Z")), 2);
  assert.equal(computeOverdueDays(due, new Date("2026-09-01T00:00:00Z")), 0); // early return
});

test("fine = days x rate, respects cap, never negative", () => {
  assert.equal(computeOverdueFine(0, 5), 0);
  assert.equal(computeOverdueFine(4, 5), 20);
  assert.equal(computeOverdueFine(100, 5, 50), 50);
  assert.equal(computeOverdueFine(3, 5, null), 15);
  assert.equal(computeOverdueFine(-2, 5), 0);
  assert.equal(computeOverdueFine(3, 0), 0);
});

test("lost penalty: price when known + enabled, else flat fallback", () => {
  assert.equal(computeLostPenalty({ price: 320, usePrice: true, flatFine: 500 }), 320);
  assert.equal(computeLostPenalty({ price: null, usePrice: true, flatFine: 500 }), 500);
  assert.equal(computeLostPenalty({ price: 0, usePrice: true, flatFine: 500 }), 500);
  assert.equal(computeLostPenalty({ price: 320, usePrice: false, flatFine: 500 }), 500);
});

test("renewal extends from the CURRENT due date, not from today", () => {
  const due = computeDueDate(new Date("2026-09-01T00:00:00Z"), 14);
  const renewed = computeDueDate(due, 14);
  assert.equal(renewed.toISOString(), "2026-09-29T23:59:59.999Z");
});

test("withIssueView derives overdue info only for ISSUED rows", () => {
  const base = { dueDate: new Date("2026-09-10T23:59:59.999Z") };
  const asOf = new Date("2026-09-14T08:00:00Z");
  const overdue = withIssueView({ ...base, status: "ISSUED" }, settings, asOf);
  assert.equal(overdue.isOverdue, true);
  assert.equal(overdue.overdueDays, 4);
  assert.equal(overdue.projectedFine, 20);
  const returned = withIssueView({ ...base, status: "RETURNED" }, settings, asOf);
  assert.equal(returned.isOverdue, false);
  assert.equal(returned.projectedFine, 0);
});

test("book schema: requires authors, validates ISBN", () => {
  const ok = { title: "Physics 9-10", categoryId: oid, authorIds: [oid], isbn: "9780306406157", initialCopies: 3 };
  assert.ok(createBookSchema.safeParse({ body: ok }).success);
  assert.ok(createBookSchema.safeParse({ body: { ...ok, isbn: "0306406152" } }).success);
  assert.ok(createBookSchema.safeParse({ body: { ...ok, isbn: "080442957X" } }).success);
  assert.ok(!createBookSchema.safeParse({ body: { ...ok, authorIds: [] } }).success);
  assert.ok(!createBookSchema.safeParse({ body: { ...ok, isbn: "978-0-306" } }).success);
  assert.ok(!createBookSchema.safeParse({ body: { ...ok, initialCopies: 101 } }).success);
  assert.ok(!createBookSchema.safeParse({ body: { ...ok, title: "  " } }).success);
});

test("issue/return/copies schemas", () => {
  assert.ok(issueBookSchema.safeParse({ body: { barcode: "BK-000001", borrowerId: oid } }).success);
  assert.ok(!issueBookSchema.safeParse({ body: { barcode: "", borrowerId: oid } }).success);
  assert.ok(!issueBookSchema.safeParse({ body: { barcode: "BK-1", borrowerId: "nope" } }).success);
  assert.ok(returnBookSchema.safeParse({ body: {}, params: { id: oid } }).success);
  assert.ok(returnBookSchema.safeParse({ body: { condition: "DAMAGED", damageFine: 50 }, params: { id: oid } }).success);
  assert.ok(!returnBookSchema.safeParse({ body: { condition: "GOOD", damageFine: 50 }, params: { id: oid } }).success);
  assert.ok(!returnBookSchema.safeParse({ body: { condition: "BROKEN" }, params: { id: oid } }).success);
  assert.equal(createCopiesSchema.parse({ body: { bookId: oid } }).body.count, 1);
  assert.ok(!createCopiesSchema.safeParse({ body: { bookId: oid, count: 0 } }).success);
});

test("settings + fine schemas", () => {
  assert.ok(updateLibrarySettingsSchema.safeParse({ body: { finePerDay: 10, borrowLimits: { STUDENT: { maxBooks: 4 } } } }).success);
  assert.ok(updateLibrarySettingsSchema.safeParse({ body: { maxFinePerIssue: null } }).success);
  assert.ok(!updateLibrarySettingsSchema.safeParse({ body: { finePerDay: -1 } }).success);
  assert.ok(!updateLibrarySettingsSchema.safeParse({ body: { borrowLimits: { STUDENT: { maxBooks: 0 } } } }).success);
  assert.ok(payFineSchema.safeParse({ body: { paymentMethod: "CASH" }, params: { id: oid } }).success);
  assert.ok(!payFineSchema.safeParse({ body: { paymentMethod: "BITCOIN" }, params: { id: oid } }).success);
  assert.ok(!waiveFineSchema.safeParse({ body: { reason: "x" }, params: { id: oid } }).success);
});
