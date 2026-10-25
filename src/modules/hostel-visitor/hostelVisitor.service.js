import HostelVisitor from "./hostelVisitor.model.js";
import Student from "../student/student.model.js";
import HostelAllocation from "../hostel-allocation/hostelAllocation.model.js";
import ApiError from "../../shared/ApiError.js";

export const logVisitor = async (payload, recordedBy) => {
  const student = await Student.findOne({ _id: payload.studentId, isDeleted: false });
  if (!student) throw ApiError.badRequest("Student not found.");

  const allocation = await HostelAllocation.findOne({ studentId: payload.studentId, status: "ACTIVE" });
  if (!allocation) throw ApiError.badRequest("This student has no active hostel allocation.");

  return HostelVisitor.create({ ...payload, hostelId: allocation.hostelId, recordedBy });
};

export const listVisitors = async ({ page, limit, studentId, hostelId, activeOnly }) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (hostelId) filter.hostelId = hostelId;
  if (activeOnly) filter.checkOutTime = null;

  const [data, total] = await Promise.all([
    HostelVisitor.find(filter)
      .populate("studentId", "personalInfo.fullName studentId")
      .sort("-checkInTime")
      .skip((page - 1) * limit)
      .limit(limit),
    HostelVisitor.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const checkOutVisitor = async (id) => {
  const visitor = await HostelVisitor.findById(id);
  if (!visitor) throw ApiError.notFound("Visitor record not found.");
  if (visitor.checkOutTime) throw ApiError.conflict("This visitor has already checked out.");
  visitor.checkOutTime = new Date();
  await visitor.save();
  return visitor;
};
