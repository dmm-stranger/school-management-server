import Hostel from "../hostel/hostel.model.js";
import HostelBed from "../hostel-bed/hostelBed.model.js";
import HostelAllocation from "../hostel-allocation/hostelAllocation.model.js";
import HostelFee from "../hostel-fee/hostelFee.model.js";
import HostelVisitor from "../hostel-visitor/hostelVisitor.model.js";

/** Computed on read, same reasoning as every other *-summary module in this codebase. */
export const getHostelSummary = async () => {
  const [hostelCount, activeAllocations, bedAgg, pendingAgg, visitorsOnSite] = await Promise.all([
    Hostel.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    HostelAllocation.countDocuments({ status: "ACTIVE" }),
    HostelBed.aggregate([
      { $match: { isDeleted: false, status: { $ne: "RETIRED" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    HostelFee.aggregate([
      { $match: { status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" }, count: { $sum: 1 } } },
    ]),
    HostelVisitor.countDocuments({ checkOutTime: null }),
  ]);

  const byStatus = Object.fromEntries(bedAgg.map((r) => [r._id, r.count]));
  const totalBeds = bedAgg.reduce((sum, r) => sum + r.count, 0);

  return {
    hostelCount,
    totalBeds,
    occupiedBeds: byStatus.OCCUPIED || 0,
    availableBeds: byStatus.AVAILABLE || 0,
    activeAllocations,
    pendingFeeTotal: pendingAgg[0]?.total || 0,
    pendingFeeCount: pendingAgg[0]?.count || 0,
    visitorsOnSite,
  };
};
