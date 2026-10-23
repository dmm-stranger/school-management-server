import TransportAssignment from "./transportAssignment.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import TransportRoute from "../transport-route/transportRoute.model.js";
import TransportStop from "../transport-stop/transportStop.model.js";
import TransportFee from "../transport-fee/transportFee.model.js";
import Student from "../student/student.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { getActiveAcademicYear } from "../academic-year/academicYear.service.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createAssignment = async ({ studentId, routeId, stopId, remarks }, assignedBy) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw ApiError.badRequest("Student not found.");
  if (student.status !== "ACTIVE") throw ApiError.badRequest("Only an active student can be assigned transport.");

  const route = await TransportRoute.findOne({ _id: routeId, isDeleted: false });
  if (!route || route.status !== "ACTIVE") throw ApiError.badRequest("Route not found or inactive.");

  const stop = await TransportStop.findOne({ _id: stopId, routeId, isDeleted: false });
  if (!stop) throw ApiError.badRequest("This stop does not belong to the selected route.");

  const vehicle = await Vehicle.findOne({ _id: route.vehicleId, isDeleted: false });
  if (!vehicle || vehicle.status !== "ACTIVE") throw ApiError.badRequest("This route's vehicle is not active.");

  const alreadyAssigned = await TransportAssignment.exists({ studentId, status: "ACTIVE" });
  if (alreadyAssigned) throw ApiError.conflict("This student already has an active transport assignment. End it first to reassign.");

  const academicYear = await getActiveAcademicYear();
  if (!academicYear) throw ApiError.badRequest("No active academic year is set up.");

  const assignment = await withTransaction(async (session) => {
    // Seat-capacity check inside the transaction, immediately before the insert, so two
    // simultaneous assignments can't both slip past the same last open seat.
    const activeCount = await TransportAssignment.countDocuments({ vehicleId: vehicle._id, status: "ACTIVE" }).session(session);
    if (activeCount >= vehicle.seatCapacity) {
      throw ApiError.conflict(`${vehicle.vehicleNumber} is full (${activeCount}/${vehicle.seatCapacity} seats taken).`);
    }

    const [created] = await TransportAssignment.create(
      [{ studentId, vehicleId: vehicle._id, routeId, stopId, assignedBy, remarks: remarks || null }],
      { session }
    );

    // "Transport Fee generated from the assigned route" (flow doc §11) — one fee record per
    // assignment, snapshotting the route's fee so a later price change never rewrites history.
    await TransportFee.create(
      [
        {
          studentId,
          assignmentId: created._id,
          routeId,
          academicYearId: academicYear._id,
          amount: route.fee,
          feeFrequency: route.feeFrequency,
          dueAmount: route.fee,
        },
      ],
      { session }
    );

    return created;
  });

  return getAssignmentById(assignment._id);
};

const populateAssignment = (query) =>
  query
    .populate("studentId", "personalInfo.fullName studentId")
    .populate("vehicleId", "vehicleNumber type seatCapacity")
    .populate("routeId", "name fee feeFrequency")
    .populate("stopId", "name sequence pickupTime");

export const listAssignments = async ({ page, limit, status, vehicleId, routeId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (vehicleId) filter.vehicleId = vehicleId;
  if (routeId) filter.routeId = routeId;

  let studentFilter = null;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const matches = await Student.find({ $or: [{ "personalInfo.fullName": rx }, { studentId: rx }] }).select("_id");
    studentFilter = matches.map((m) => m._id);
    filter.studentId = { $in: studentFilter };
  }

  const [data, total] = await Promise.all([
    populateAssignment(TransportAssignment.find(filter))
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    TransportAssignment.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getAssignmentById = async (id) => {
  const assignment = await populateAssignment(TransportAssignment.findById(id));
  if (!assignment) throw ApiError.notFound("Assignment not found.");
  return assignment;
};

export const getActiveAssignmentForStudent = async (studentId) => {
  const assignment = await populateAssignment(TransportAssignment.findOne({ studentId, status: "ACTIVE" }));
  if (!assignment) throw ApiError.notFound("This student has no active transport assignment.");
  return assignment;
};

/** Frees the seat. Any TransportFee already generated stays owed — the service was rendered. */
export const endAssignment = async (id, { remarks }, endedBy) => {
  const assignment = await TransportAssignment.findById(id);
  if (!assignment) throw ApiError.notFound("Assignment not found.");
  if (assignment.status !== "ACTIVE") throw ApiError.conflict("This assignment is not active.");

  assignment.status = "ENDED";
  assignment.endDate = new Date();
  assignment.endedBy = endedBy;
  if (remarks) assignment.remarks = remarks;
  await assignment.save();
  return getAssignmentById(assignment._id);
};
