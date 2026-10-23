import assert from "node:assert/strict";
import { test } from "node:test";
import { createDriverSchema, updateDriverSchema } from "../src/modules/driver/driver.validation.js";
import { createVehicleSchema, updateVehicleSchema } from "../src/modules/vehicle/vehicle.validation.js";
import { createRouteSchema } from "../src/modules/transport-route/transportRoute.validation.js";
import { createStopSchema, reorderStopsSchema } from "../src/modules/transport-stop/transportStop.validation.js";
import { createAssignmentSchema } from "../src/modules/transport-assignment/transportAssignment.validation.js";
import { payTransportFeeSchema } from "../src/modules/transport-fee/transportFee.validation.js";

const oid = "64f1a2b3c4d5e6f7a8b9c0d1";
const oid2 = "64f1a2b3c4d5e6f7a8b9c0d2";

test("driver schema: requires name/phone/license, blank email-less fields ok", () => {
  assert.ok(createDriverSchema.safeParse({ body: { name: "Karim Mia", phone: "01712345678", licenseNumber: "DL-1001" } }).success);
  assert.ok(!createDriverSchema.safeParse({ body: { name: "", phone: "01712345678", licenseNumber: "DL-1001" } }).success);
  assert.ok(!createDriverSchema.safeParse({ body: { name: "Karim", phone: "123", licenseNumber: "DL-1" } }).success);
  assert.ok(updateDriverSchema.safeParse({ body: { status: "INACTIVE" }, params: { id: oid } }).success);
});

test("vehicle schema: seat capacity must be positive, driverId optional/nullable on update", () => {
  assert.ok(createVehicleSchema.safeParse({ body: { vehicleNumber: "DHA-1234", type: "BUS", seatCapacity: 40 } }).success);
  assert.ok(!createVehicleSchema.safeParse({ body: { vehicleNumber: "DHA-1234", type: "BUS", seatCapacity: 0 } }).success);
  assert.ok(!createVehicleSchema.safeParse({ body: { vehicleNumber: "X", type: "ROCKET", seatCapacity: 10 } }).success);
  assert.ok(updateVehicleSchema.safeParse({ body: { driverId: null }, params: { id: oid } }).success);
  assert.ok(updateVehicleSchema.safeParse({ body: { driverId: oid }, params: { id: oid } }).success);
});

test("route schema: fee required, frequency defaults to MONTHLY", () => {
  const parsed = createRouteSchema.parse({ body: { name: "Route A", vehicleId: oid, fee: 1500 } });
  assert.equal(parsed.body.feeFrequency, "MONTHLY");
  assert.ok(!createRouteSchema.safeParse({ body: { name: "Route A", vehicleId: oid, fee: -5 } }).success);
});

test("stop schema: sequence >= 1, pickupTime must be HH:MM 24h", () => {
  assert.ok(createStopSchema.safeParse({ body: { routeId: oid, name: "Gate 3", sequence: 1, pickupTime: "07:30" } }).success);
  assert.ok(!createStopSchema.safeParse({ body: { routeId: oid, name: "Gate 3", sequence: 0 } }).success);
  assert.ok(!createStopSchema.safeParse({ body: { routeId: oid, name: "Gate 3", sequence: 1, pickupTime: "7:30 AM" } }).success);
});

test("reorder schema: rejects empty list, accepts a valid batch", () => {
  assert.ok(!reorderStopsSchema.safeParse({ body: { stops: [] }, params: { routeId: oid } }).success);
  assert.ok(
    reorderStopsSchema.safeParse({
      body: { stops: [{ id: oid, sequence: 2 }, { id: oid2, sequence: 1 }] },
      params: { routeId: oid },
    }).success
  );
});

test("assignment schema: student/route/stop all required object IDs", () => {
  assert.ok(createAssignmentSchema.safeParse({ body: { studentId: oid, routeId: oid, stopId: oid } }).success);
  assert.ok(!createAssignmentSchema.safeParse({ body: { studentId: oid, routeId: oid } }).success);
});

test("transport fee payment schema: amount must be positive, method restricted to known enum", () => {
  assert.ok(payTransportFeeSchema.safeParse({ body: { amount: 500, paymentMethod: "CASH" }, params: { id: oid } }).success);
  assert.ok(!payTransportFeeSchema.safeParse({ body: { amount: 0, paymentMethod: "CASH" }, params: { id: oid } }).success);
  assert.ok(!payTransportFeeSchema.safeParse({ body: { amount: 500, paymentMethod: "CRYPTO" }, params: { id: oid } }).success);
});

/* ---- seat-capacity / partial-payment arithmetic used by the services (pure logic, no DB) ---- */
test("partial payment math mirrors transportFee.service.payTransportFee", () => {
  const amount = 1500, paidAmount = 0;
  const pay = 600;
  const newPaid = paidAmount + pay;
  const newDue = amount - newPaid;
  assert.equal(newPaid, 600);
  assert.equal(newDue, 900);
  const status = newDue <= 0 ? "PAID" : "PARTIAL";
  assert.equal(status, "PARTIAL");

  const finalPay = 900;
  const finalPaid = newPaid + finalPay;
  const finalDue = amount - finalPaid;
  assert.equal(finalDue, 0);
  assert.equal(finalDue <= 0 ? "PAID" : "PARTIAL", "PAID");
});

test("seat availability math mirrors transportSummary.service", () => {
  const totalSeats = 80, activeAssignments = 85; // over-assigned edge case shouldn't go negative
  assert.equal(Math.max(0, totalSeats - activeAssignments), 0);
  assert.equal(Math.max(0, 80 - 30), 50);
});
