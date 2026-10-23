import TransportStop from "./transportStop.model.js";
import TransportRoute from "../transport-route/transportRoute.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";

const assertRouteExists = async (routeId) => {
  const route = await TransportRoute.findOne({ _id: routeId, isDeleted: false });
  if (!route) throw ApiError.badRequest("Route not found.");
  return route;
};

const assertSequenceFree = async (routeId, sequence, ignoreId) => {
  const clash = await TransportStop.findOne({
    routeId,
    sequence,
    isDeleted: false,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
  });
  if (clash) throw ApiError.conflict(`Position ${sequence} is already taken by "${clash.name}" on this route.`);
};

export const createStop = async (payload) => {
  await assertRouteExists(payload.routeId);
  await assertSequenceFree(payload.routeId, payload.sequence);
  return TransportStop.create(payload);
};

export const listStopsForRoute = (routeId) => TransportStop.find({ routeId, isDeleted: false }).sort("sequence");

export const getStopById = async (id) => {
  const stop = await TransportStop.findOne({ _id: id, isDeleted: false });
  if (!stop) throw ApiError.notFound("Stop not found.");
  return stop;
};

export const updateStop = async (id, updates) => {
  const stop = await TransportStop.findOne({ _id: id, isDeleted: false });
  if (!stop) throw ApiError.notFound("Stop not found.");
  if (updates.sequence !== undefined && updates.sequence !== stop.sequence) {
    await assertSequenceFree(stop.routeId, updates.sequence, id);
  }
  Object.assign(stop, updates);
  await stop.save();
  return stop;
};

export const deleteStop = async (id) => {
  const stop = await TransportStop.findOne({ _id: id, isDeleted: false });
  if (!stop) throw ApiError.notFound("Stop not found.");

  const TransportAssignment = (await import("../transport-assignment/transportAssignment.model.js")).default;
  const inUse = await TransportAssignment.countDocuments({ stopId: id, status: "ACTIVE" });
  if (inUse > 0) throw ApiError.conflict("Students are currently assigned to this stop. Reassign them first.");

  stop.isDeleted = true;
  await stop.save();
};

/**
 * Drag-and-drop reorder: every stop moves to its new position together, or
 * none do — avoids a half-reordered route if the request is interrupted.
 * Writes temporary negative sequences first so the unique (routeId, sequence)
 * index never collides mid-swap.
 */
export const reorderStops = async (routeId, stops) => {
  await assertRouteExists(routeId);
  const ids = stops.map((s) => s.id);
  const existing = await TransportStop.find({ _id: { $in: ids }, routeId, isDeleted: false });
  if (existing.length !== ids.length) throw ApiError.badRequest("One or more stops don't belong to this route.");

  const seqs = stops.map((s) => s.sequence);
  if (new Set(seqs).size !== seqs.length) throw ApiError.badRequest("Positions must be unique.");

  return withTransaction(async (session) => {
    for (const s of stops) {
      await TransportStop.updateOne({ _id: s.id }, { $set: { sequence: -s.sequence } }, { session });
    }
    for (const s of stops) {
      await TransportStop.updateOne({ _id: s.id }, { $set: { sequence: s.sequence } }, { session });
    }
    return TransportStop.find({ routeId, isDeleted: false }).sort("sequence").session(session);
  });
};

