import TransportRoute from "./transportRoute.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import ApiError from "../../shared/ApiError.js";

export const createRoute = async (payload, userId) => {
  const vehicle = await Vehicle.findOne({ _id: payload.vehicleId, isDeleted: false });
  if (!vehicle) throw ApiError.badRequest("Vehicle not found.");
  if (vehicle.status !== "ACTIVE") throw ApiError.badRequest("This vehicle is not active.");
  return TransportRoute.create({ ...payload, createdBy: userId });
};

export const listRoutes = async ({ page, limit, search, status, vehicleId }) => {
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (vehicleId) filter.vehicleId = vehicleId;
  if (search) filter.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [data, total] = await Promise.all([
    TransportRoute.find(filter).populate("vehicleId", "vehicleNumber seatCapacity type").sort("name").skip((page - 1) * limit).limit(limit),
    TransportRoute.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getRouteById = async (id) => {
  const route = await TransportRoute.findOne({ _id: id, isDeleted: false }).populate("vehicleId", "vehicleNumber seatCapacity type driverId");
  if (!route) throw ApiError.notFound("Route not found.");

  const TransportStop = (await import("../transport-stop/transportStop.model.js")).default;
  const TransportAssignment = (await import("../transport-assignment/transportAssignment.model.js")).default;
  const [stops, activeCount] = await Promise.all([
    TransportStop.find({ routeId: id, isDeleted: false }).sort("sequence"),
    TransportAssignment.countDocuments({ routeId: id, status: "ACTIVE" }),
  ]);

  return { ...route.toObject(), stops, assignedCount: activeCount };
};

export const updateRoute = async (id, updates) => {
  const route = await TransportRoute.findOne({ _id: id, isDeleted: false });
  if (!route) throw ApiError.notFound("Route not found.");

  if (updates.vehicleId && String(updates.vehicleId) !== String(route.vehicleId)) {
    const vehicle = await Vehicle.findOne({ _id: updates.vehicleId, isDeleted: false });
    if (!vehicle) throw ApiError.badRequest("Vehicle not found.");
  }

  Object.assign(route, updates);
  await route.save();
  return route;
};

export const deleteRoute = async (id) => {
  const route = await TransportRoute.findOne({ _id: id, isDeleted: false });
  if (!route) throw ApiError.notFound("Route not found.");

  const TransportAssignment = (await import("../transport-assignment/transportAssignment.model.js")).default;
  const active = await TransportAssignment.countDocuments({ routeId: id, status: "ACTIVE" });
  if (active > 0) throw ApiError.conflict(`${active} student(s) are currently assigned to this route. End those assignments first.`);

  const TransportStop = (await import("../transport-stop/transportStop.model.js")).default;
  route.isDeleted = true;
  route.status = "INACTIVE";
  await route.save();
  await TransportStop.updateMany({ routeId: id, isDeleted: false }, { $set: { isDeleted: true } });
};
