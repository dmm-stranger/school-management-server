import Vehicle from "./vehicle.model.js";
import Driver from "../driver/driver.model.js";
import ApiError from "../../shared/ApiError.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A driver can't be double-booked: at most one active vehicle at a time. */
const assertDriverFree = async (driverId, ignoreVehicleId) => {
  if (!driverId) return;
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw ApiError.badRequest("Driver not found.");
  if (driver.status !== "ACTIVE") throw ApiError.badRequest("This driver is not active.");

  const busyWith = await Vehicle.findOne({
    driverId,
    isDeleted: false,
    status: { $ne: "INACTIVE" },
    ...(ignoreVehicleId ? { _id: { $ne: ignoreVehicleId } } : {}),
  });
  if (busyWith) throw ApiError.conflict(`${driver.name} is already assigned to vehicle ${busyWith.vehicleNumber}.`);
};

export const createVehicle = async (payload, userId) => {
  const existing = await Vehicle.findOne({ vehicleNumber: payload.vehicleNumber.toUpperCase(), isDeleted: false });
  if (existing) throw ApiError.conflict(`Vehicle "${payload.vehicleNumber}" already exists.`);
  await assertDriverFree(payload.driverId);
  return Vehicle.create({ ...payload, createdBy: userId });
};

export const listVehicles = async ({ page, limit, search, status }) => {
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.vehicleNumber = new RegExp(escapeRegex(search), "i");

  const [data, total] = await Promise.all([
    Vehicle.find(filter).populate("driverId", "name phone").sort("vehicleNumber").skip((page - 1) * limit).limit(limit),
    Vehicle.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false }).populate("driverId", "name phone licenseNumber");
  if (!vehicle) throw ApiError.notFound("Vehicle not found.");
  return vehicle;
};

export const updateVehicle = async (id, updates) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false });
  if (!vehicle) throw ApiError.notFound("Vehicle not found.");

  if (updates.vehicleNumber && updates.vehicleNumber.toUpperCase() !== vehicle.vehicleNumber) {
    const dup = await Vehicle.findOne({ vehicleNumber: updates.vehicleNumber.toUpperCase(), isDeleted: false, _id: { $ne: id } });
    if (dup) throw ApiError.conflict(`Vehicle "${updates.vehicleNumber}" already exists.`);
  }
  if (updates.driverId !== undefined && String(updates.driverId || "") !== String(vehicle.driverId || "")) {
    await assertDriverFree(updates.driverId, id);
  }
  if (updates.seatCapacity !== undefined && updates.seatCapacity < vehicle.seatCapacity) {
    const TransportAssignment = (await import("../transport-assignment/transportAssignment.model.js")).default;
    const activeCount = await TransportAssignment.countDocuments({ vehicleId: id, status: "ACTIVE" });
    if (updates.seatCapacity < activeCount) {
      throw ApiError.conflict(`Can't reduce capacity below ${activeCount} — that many students are already assigned.`);
    }
  }

  Object.assign(vehicle, updates);
  await vehicle.save();
  return vehicle;
};

export const deleteVehicle = async (id) => {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false });
  if (!vehicle) throw ApiError.notFound("Vehicle not found.");

  const TransportRoute = (await import("../transport-route/transportRoute.model.js")).default;
  const inUse = await TransportRoute.countDocuments({ vehicleId: id, isDeleted: false, status: "ACTIVE" });
  if (inUse > 0) throw ApiError.conflict("This vehicle is used by an active route. Reassign or deactivate the route first.");

  vehicle.isDeleted = true;
  vehicle.status = "INACTIVE";
  await vehicle.save();
};
