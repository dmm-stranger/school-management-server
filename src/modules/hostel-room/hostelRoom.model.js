import mongoose from "mongoose";

const hostelRoomSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    roomNumber: { type: String, required: true, trim: true },
    floor: { type: String, trim: true, default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Room number unique per hostel, not globally — two hostels can each have a "Room 101".
hostelRoomSchema.index(
  { hostelId: 1, roomNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const HostelRoom = mongoose.model("HostelRoom", hostelRoomSchema);

export default HostelRoom;
