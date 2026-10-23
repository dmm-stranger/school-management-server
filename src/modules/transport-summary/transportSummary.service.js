import Vehicle from "../vehicle/vehicle.model.js";
import Driver from "../driver/driver.model.js";
import TransportRoute from "../transport-route/transportRoute.model.js";
import TransportAssignment from "../transport-assignment/transportAssignment.model.js";
import TransportFee from "../transport-fee/transportFee.model.js";

/** Computed on read, same reasoning as library-summary and attendance-summary. */
export const getTransportSummary = async () => {
  const [vehicleCount, activeVehicles, driverCount, routeCount, activeAssignments, capacityAgg, pendingAgg] = await Promise.all([
    Vehicle.countDocuments({ isDeleted: false }),
    Vehicle.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    Driver.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    TransportRoute.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    TransportAssignment.countDocuments({ status: "ACTIVE" }),
    Vehicle.aggregate([
      { $match: { isDeleted: false, status: "ACTIVE" } },
      { $group: { _id: null, totalSeats: { $sum: "$seatCapacity" } } },
    ]),
    TransportFee.aggregate([
      { $match: { status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalSeats = capacityAgg[0]?.totalSeats || 0;
  return {
    vehicleCount,
    activeVehicles,
    driverCount,
    routeCount,
    activeAssignments,
    totalSeats,
    seatsAvailable: Math.max(0, totalSeats - activeAssignments),
    pendingFeeTotal: pendingAgg[0]?.total || 0,
    pendingFeeCount: pendingAgg[0]?.count || 0,
  };
};
