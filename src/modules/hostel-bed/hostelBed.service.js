import HostelBed, { MANUAL_BED_STATUSES } from "./hostelBed.model.js";
import HostelRoom from "../hostel-room/hostelRoom.model.js";
import ApiError from "../../shared/ApiError.js";

export const createBeds = async ({ roomId, bedNumbers }) => {
  const room = await HostelRoom.findOne({ _id: roomId, isDeleted: false });
  if (!room) throw ApiError.badRequest("Room not found.");

  const existing = await HostelBed.find({ roomId, bedNumber: { $in: bedNumbers }, isDeleted: false }).select("bedNumber");
  if (existing.length > 0) {
    throw ApiError.conflict(`Bed(s) already exist in this room: ${existing.map((b) => b.bedNumber).join(", ")}.`);
  }

  return HostelBed.create(bedNumbers.map((bedNumber) => ({ hostelId: room.hostelId, roomId, bedNumber })));
};

export const listBedsForRoom = (roomId) => HostelBed.find({ roomId, isDeleted: false }).sort("bedNumber");

export const getBedById = async (id) => {
  const bed = await HostelBed.findOne({ _id: id, isDeleted: false }).populate("roomId", "roomNumber floor");
  if (!bed) throw ApiError.notFound("Bed not found.");
  return bed;
};

export const updateBed = async (id, { status }) => {
  const bed = await HostelBed.findOne({ _id: id, isDeleted: false });
  if (!bed) throw ApiError.notFound("Bed not found.");
  if (bed.status === "OCCUPIED") throw ApiError.conflict("This bed is occupied. End the allocation before changing its status.");
  if (!MANUAL_BED_STATUSES.includes(status)) throw ApiError.badRequest("A bed can only become OCCUPIED through the allocation flow.");
  bed.status = status;
  await bed.save();
  return bed;
};

export const deleteBed = async (id) => {
  const bed = await HostelBed.findOne({ _id: id, isDeleted: false });
  if (!bed) throw ApiError.notFound("Bed not found.");
  if (bed.status === "OCCUPIED") throw ApiError.conflict("This bed is occupied. End the allocation before removing it.");
  bed.isDeleted = true;
  bed.status = "RETIRED";
  await bed.save();
};
