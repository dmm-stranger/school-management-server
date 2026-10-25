import HostelAllocation from "./hostelAllocation.model.js";
import HostelBed from "../hostel-bed/hostelBed.model.js";
import HostelRoom from "../hostel-room/hostelRoom.model.js";
import Hostel from "../hostel/hostel.model.js";
import HostelFee from "../hostel-fee/hostelFee.model.js";
import Student from "../student/student.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { getActiveAcademicYear } from "../academic-year/academicYear.service.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Interpretation beyond the flow doc's literal text (flagged in PROGRESS-LOG.md): a BOYS/GIRLS
 * hostel is checked against the student's gender; MIXED accepts anyone. The flow doc doesn't
 * state this explicitly, but allocating a student to a hostel of the wrong type is the kind of
 * mistake this system should catch rather than silently allow.
 */
const assertGenderMatch = (hostel, student) => {
  if (hostel.type === "MIXED") return;
  const expected = hostel.type === "BOYS" ? "MALE" : "FEMALE";
  if (student.personalInfo.gender !== expected) {
    throw ApiError.badRequest(`${hostel.name} is a ${hostel.type.toLowerCase()} hostel and can't accept this student.`);
  }
};

export const createAllocation = async ({ studentId, roomId, bedId, remarks }, allocatedBy) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw ApiError.badRequest("Student not found.");
  if (student.status !== "ACTIVE") throw ApiError.badRequest("Only an active student can be allocated hostel accommodation.");

  const room = await HostelRoom.findOne({ _id: roomId, isDeleted: false });
  if (!room || room.status !== "ACTIVE") throw ApiError.badRequest("Room not found or inactive.");

  const bed = await HostelBed.findOne({ _id: bedId, roomId, isDeleted: false });
  if (!bed) throw ApiError.badRequest("This bed does not belong to the selected room.");

  const hostel = await Hostel.findOne({ _id: room.hostelId, isDeleted: false });
  if (!hostel || hostel.status !== "ACTIVE") throw ApiError.badRequest("This room's hostel is not active.");

  assertGenderMatch(hostel, student);

  const alreadyAllocated = await HostelAllocation.exists({ studentId, status: "ACTIVE" });
  if (alreadyAllocated) throw ApiError.conflict("This student already has an active hostel allocation. End it first to reallocate.");

  const academicYear = await getActiveAcademicYear();
  if (!academicYear) throw ApiError.badRequest("No active academic year is set up.");

  const allocation = await withTransaction(async (session) => {
    // Atomic claim inside the transaction, immediately before the insert — closes the race
    // between two simultaneous allocations to the same bed. Same pattern as Transport's seat
    // claim and Library's copy claim.
    const claimed = await HostelBed.findOneAndUpdate({ _id: bedId, status: "AVAILABLE" }, { $set: { status: "OCCUPIED" } }, { session, new: true });
    if (!claimed) throw ApiError.conflict("This bed was just taken by someone else.");

    const [created] = await HostelAllocation.create(
      [{ studentId, hostelId: hostel._id, roomId, bedId, allocatedBy, remarks: remarks || null }],
      { session }
    );

    // "Hostel Fee generated" (flow doc) — one fee record per allocation, snapshotting the
    // hostel's fee so a later price change never rewrites a student's already-owed amount.
    await HostelFee.create(
      [
        {
          studentId,
          allocationId: created._id,
          hostelId: hostel._id,
          academicYearId: academicYear._id,
          amount: hostel.fee,
          feeFrequency: hostel.feeFrequency,
          dueAmount: hostel.fee,
        },
      ],
      { session }
    );

    return created;
  });

  return getAllocationById(allocation._id);
};

const populateAllocation = (query) =>
  query
    .populate("studentId", "personalInfo.fullName studentId")
    .populate("hostelId", "name type")
    .populate("roomId", "roomNumber floor")
    .populate("bedId", "bedNumber");

export const listAllocations = async ({ page, limit, status, hostelId, roomId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (hostelId) filter.hostelId = hostelId;
  if (roomId) filter.roomId = roomId;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const matches = await Student.find({ $or: [{ "personalInfo.fullName": rx }, { studentId: rx }] }).select("_id");
    filter.studentId = { $in: matches.map((m) => m._id) };
  }

  const [data, total] = await Promise.all([
    populateAllocation(HostelAllocation.find(filter)).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    HostelAllocation.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getAllocationById = async (id) => {
  const allocation = await populateAllocation(HostelAllocation.findById(id));
  if (!allocation) throw ApiError.notFound("Allocation not found.");
  return allocation;
};

export const getActiveAllocationForStudent = async (studentId) => {
  const allocation = await populateAllocation(HostelAllocation.findOne({ studentId, status: "ACTIVE" }));
  if (!allocation) throw ApiError.notFound("This student has no active hostel allocation.");
  return allocation;
};

/** Frees the bed. Any HostelFee already generated stays owed — the accommodation was provided. */
export const endAllocation = async (id, { remarks }, endedBy) => {
  const allocation = await HostelAllocation.findById(id);
  if (!allocation) throw ApiError.notFound("Allocation not found.");
  if (allocation.status !== "ACTIVE") throw ApiError.conflict("This allocation is not active.");

  await withTransaction(async (session) => {
    allocation.status = "ENDED";
    allocation.endDate = new Date();
    allocation.endedBy = endedBy;
    if (remarks) allocation.remarks = remarks;
    await allocation.save({ session });
    await HostelBed.updateOne({ _id: allocation.bedId }, { $set: { status: "AVAILABLE" } }, { session });
  });

  return getAllocationById(allocation._id);
};
