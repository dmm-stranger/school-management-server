import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostelSchema, updateHostelSchema } from "../src/modules/hostel/hostel.validation.js";
import { createRoomSchema } from "../src/modules/hostel-room/hostelRoom.validation.js";
import { createBedsSchema, updateBedSchema } from "../src/modules/hostel-bed/hostelBed.validation.js";
import { createAllocationSchema } from "../src/modules/hostel-allocation/hostelAllocation.validation.js";
import { payHostelFeeSchema, adjustHostelFeeSchema } from "../src/modules/hostel-fee/hostelFee.validation.js";
import { logVisitorSchema } from "../src/modules/hostel-visitor/hostelVisitor.validation.js";

const oid = "64f1a2b3c4d5e6f7a8b9c0d1";

test("hostel schema: type restricted to BOYS/GIRLS/MIXED, fee non-negative", () => {
  assert.ok(createHostelSchema.safeParse({ body: { name: "North Hostel", type: "BOYS", fee: 3000 } }).success);
  assert.ok(!createHostelSchema.safeParse({ body: { name: "North Hostel", type: "COED", fee: 3000 } }).success);
  assert.ok(!createHostelSchema.safeParse({ body: { name: "North Hostel", type: "BOYS", fee: -1 } }).success);
  assert.ok(updateHostelSchema.safeParse({ body: { wardenId: null }, params: { id: oid } }).success);
});

test("room schema: hostelId + roomNumber required", () => {
  assert.ok(createRoomSchema.safeParse({ body: { hostelId: oid, roomNumber: "101" } }).success);
  assert.ok(!createRoomSchema.safeParse({ body: { hostelId: oid, roomNumber: "" } }).success);
});

test("bed schema: bulk create 1-50 bed numbers, manual status excludes OCCUPIED", () => {
  assert.ok(createBedsSchema.safeParse({ body: { roomId: oid, bedNumbers: ["A", "B"] } }).success);
  assert.ok(!createBedsSchema.safeParse({ body: { roomId: oid, bedNumbers: [] } }).success);
  assert.ok(!createBedsSchema.safeParse({ body: { roomId: oid, bedNumbers: Array(51).fill("X") } }).success);
  assert.ok(updateBedSchema.safeParse({ body: { status: "MAINTENANCE" }, params: { id: oid } }).success);
  assert.ok(!updateBedSchema.safeParse({ body: { status: "OCCUPIED" }, params: { id: oid } }).success);
});

test("allocation schema: student/room/bed all required", () => {
  assert.ok(createAllocationSchema.safeParse({ body: { studentId: oid, roomId: oid, bedId: oid } }).success);
  assert.ok(!createAllocationSchema.safeParse({ body: { studentId: oid, roomId: oid } }).success);
});

test("hostel fee payment schema: amount positive, method restricted", () => {
  assert.ok(payHostelFeeSchema.safeParse({ body: { amount: 500, paymentMethod: "CASH" }, params: { id: oid } }).success);
  assert.ok(!payHostelFeeSchema.safeParse({ body: { amount: 0, paymentMethod: "CASH" }, params: { id: oid } }).success);
});

test("hostel fee adjust schema: requires discount or fine plus a reason", () => {
  assert.ok(adjustHostelFeeSchema.safeParse({ body: { discount: 200, reason: "Sibling discount" }, params: { id: oid } }).success);
  assert.ok(!adjustHostelFeeSchema.safeParse({ body: { reason: "no field given" }, params: { id: oid } }).success);
  assert.ok(!adjustHostelFeeSchema.safeParse({ body: { discount: 200, reason: "x" }, params: { id: oid } }).success); // reason too short
});

test("visitor log schema: name required, phone/relation/purpose optional", () => {
  assert.ok(logVisitorSchema.safeParse({ body: { studentId: oid, visitorName: "Mr. Rahman" } }).success);
  assert.ok(!logVisitorSchema.safeParse({ body: { studentId: oid, visitorName: "" } }).success);
});

/* ---- pure arithmetic mirrored from hostelFee.service (same formula as StudentFee, Phase 6) ---- */
test("hostel fee due/status arithmetic mirrors hostelFee.service", () => {
  const computeDueAmount = (fee) => Math.max(0, fee.amount - fee.discount + fee.fine - fee.paidAmount);
  const computeStatus = (fee) => {
    if (fee.status === "CANCELLED") return "CANCELLED";
    const due = computeDueAmount(fee);
    if (due <= 0) return "PAID";
    if (fee.paidAmount > 0) return "PARTIAL";
    return "PENDING";
  };

  let fee = { amount: 3000, discount: 0, fine: 0, paidAmount: 0, status: "PENDING" };
  assert.equal(computeDueAmount(fee), 3000);
  assert.equal(computeStatus(fee), "PENDING");

  fee = { amount: 3000, discount: 500, fine: 0, paidAmount: 1000, status: "PENDING" };
  assert.equal(computeDueAmount(fee), 1500);
  assert.equal(computeStatus(fee), "PARTIAL");

  fee = { amount: 3000, discount: 0, fine: 100, paidAmount: 3100, status: "PENDING" };
  assert.equal(computeDueAmount(fee), 0);
  assert.equal(computeStatus(fee), "PAID");

  fee = { amount: 3000, discount: 0, fine: 0, paidAmount: 0, status: "CANCELLED" };
  assert.equal(computeStatus(fee), "CANCELLED");
});

test("gender/hostel-type match mirrors hostelAllocation.service.assertGenderMatch", () => {
  const matches = (hostelType, gender) => hostelType === "MIXED" || gender === (hostelType === "BOYS" ? "MALE" : "FEMALE");
  assert.equal(matches("BOYS", "MALE"), true);
  assert.equal(matches("BOYS", "FEMALE"), false);
  assert.equal(matches("GIRLS", "FEMALE"), true);
  assert.equal(matches("GIRLS", "MALE"), false);
  assert.equal(matches("MIXED", "MALE"), true);
  assert.equal(matches("MIXED", "FEMALE"), true);
});
