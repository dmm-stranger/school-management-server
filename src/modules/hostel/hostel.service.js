import Hostel from "./hostel.model.js";
import Staff from "../staff/staff.model.js";
import ApiError from "../../shared/ApiError.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertWardenActive = async (wardenId) => {
  if (!wardenId) return;
  const staff = await Staff.findOne({ _id: wardenId, isDeleted: false });
  if (!staff) throw ApiError.badRequest("Staff record not found.");
  if (staff.status !== "ACTIVE") throw ApiError.badRequest("This staff member is not active.");
};

export const createHostel = async (payload, userId) => {
  await assertWardenActive(payload.wardenId);
  return Hostel.create({ ...payload, createdBy: userId });
};

export const listHostels = async ({ page, limit, search, status, type }) => {
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  const [data, total] = await Promise.all([
    Hostel.find(filter).populate("wardenId", "personalInfo.fullName designation").sort("name").skip((page - 1) * limit).limit(limit),
    Hostel.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getHostelById = async (id) => {
  const hostel = await Hostel.findOne({ _id: id, isDeleted: false }).populate("wardenId", "personalInfo.fullName designation");
  if (!hostel) throw ApiError.notFound("Hostel not found.");

  const HostelRoom = (await import("../hostel-room/hostelRoom.model.js")).default;
  const HostelBed = (await import("../hostel-bed/hostelBed.model.js")).default;
  const [roomCount, bedAgg] = await Promise.all([
    HostelRoom.countDocuments({ hostelId: id, isDeleted: false }),
    HostelBed.aggregate([
      { $match: { hostelId: hostel._id, isDeleted: false, status: { $ne: "RETIRED" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  const byStatus = Object.fromEntries(bedAgg.map((r) => [r._id, r.count]));
  const totalBeds = bedAgg.reduce((sum, r) => sum + r.count, 0);

  return { ...hostel.toObject(), roomCount, totalBeds, occupiedBeds: byStatus.OCCUPIED || 0, availableBeds: byStatus.AVAILABLE || 0 };
};

export const updateHostel = async (id, updates) => {
  const hostel = await Hostel.findOne({ _id: id, isDeleted: false });
  if (!hostel) throw ApiError.notFound("Hostel not found.");
  if (updates.wardenId !== undefined && String(updates.wardenId || "") !== String(hostel.wardenId || "")) {
    await assertWardenActive(updates.wardenId);
  }
  Object.assign(hostel, updates);
  await hostel.save();
  return hostel;
};

export const deleteHostel = async (id) => {
  const hostel = await Hostel.findOne({ _id: id, isDeleted: false });
  if (!hostel) throw ApiError.notFound("Hostel not found.");

  const HostelAllocation = (await import("../hostel-allocation/hostelAllocation.model.js")).default;
  const active = await HostelAllocation.countDocuments({ hostelId: id, status: "ACTIVE" });
  if (active > 0) throw ApiError.conflict(`${active} student(s) are currently allocated here. End those allocations first.`);

  const HostelRoom = (await import("../hostel-room/hostelRoom.model.js")).default;
  const HostelBed = (await import("../hostel-bed/hostelBed.model.js")).default;
  hostel.isDeleted = true;
  hostel.status = "INACTIVE";
  await hostel.save();
  await HostelRoom.updateMany({ hostelId: id, isDeleted: false }, { $set: { isDeleted: true } });
  await HostelBed.updateMany({ hostelId: id, isDeleted: false }, { $set: { isDeleted: true, status: "RETIRED" } });
};
