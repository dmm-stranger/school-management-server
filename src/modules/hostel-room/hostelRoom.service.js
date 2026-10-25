import HostelRoom from "./hostelRoom.model.js";
import Hostel from "../hostel/hostel.model.js";
import ApiError from "../../shared/ApiError.js";

const assertHostelExists = async (hostelId) => {
  const hostel = await Hostel.findOne({ _id: hostelId, isDeleted: false });
  if (!hostel) throw ApiError.badRequest("Hostel not found.");
  return hostel;
};

const assertRoomNumberFree = async (hostelId, roomNumber, ignoreId) => {
  const clash = await HostelRoom.findOne({
    hostelId,
    roomNumber,
    isDeleted: false,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
  });
  if (clash) throw ApiError.conflict(`Room "${roomNumber}" already exists in this hostel.`);
};

export const createRoom = async (payload) => {
  await assertHostelExists(payload.hostelId);
  await assertRoomNumberFree(payload.hostelId, payload.roomNumber);
  return HostelRoom.create(payload);
};

export const listRoomsForHostel = (hostelId) => HostelRoom.find({ hostelId, isDeleted: false }).sort("roomNumber");

export const getRoomById = async (id) => {
  const room = await HostelRoom.findOne({ _id: id, isDeleted: false });
  if (!room) throw ApiError.notFound("Room not found.");

  const HostelBed = (await import("../hostel-bed/hostelBed.model.js")).default;
  const beds = await HostelBed.find({ roomId: id, isDeleted: false }).sort("bedNumber");
  return { ...room.toObject(), beds };
};

export const updateRoom = async (id, updates) => {
  const room = await HostelRoom.findOne({ _id: id, isDeleted: false });
  if (!room) throw ApiError.notFound("Room not found.");
  if (updates.roomNumber && updates.roomNumber !== room.roomNumber) {
    await assertRoomNumberFree(room.hostelId, updates.roomNumber, id);
  }
  Object.assign(room, updates);
  await room.save();
  return room;
};

export const deleteRoom = async (id) => {
  const room = await HostelRoom.findOne({ _id: id, isDeleted: false });
  if (!room) throw ApiError.notFound("Room not found.");

  const HostelBed = (await import("../hostel-bed/hostelBed.model.js")).default;
  const occupied = await HostelBed.countDocuments({ roomId: id, isDeleted: false, status: "OCCUPIED" });
  if (occupied > 0) throw ApiError.conflict("This room has occupied beds. End those allocations first.");

  room.isDeleted = true;
  await room.save();
  await HostelBed.updateMany({ roomId: id, isDeleted: false }, { $set: { isDeleted: true, status: "RETIRED" } });
};
