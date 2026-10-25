import HostelFee from "./hostelFee.model.js";
import Student from "../student/student.model.js";
import Transaction from "../transaction/transaction.model.js";
import Receipt from "../receipt/receipt.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { generateReceiptNumber } from "../../utils/idGenerator.util.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Same formula as StudentFee (Phase 6): amount - discount + fine - paidAmount, floored at 0. */
const computeDueAmount = (fee) => Math.max(0, fee.amount - fee.discount + fee.fine - fee.paidAmount);
const computeStatus = (fee) => {
  if (fee.status === "CANCELLED") return "CANCELLED";
  const due = computeDueAmount(fee);
  if (due <= 0) return "PAID";
  if (fee.paidAmount > 0) return "PARTIAL";
  return "PENDING";
};

const populateFee = (query) =>
  query.populate("studentId", "personalInfo.fullName studentId").populate("hostelId", "name");

export const listHostelFees = async ({ page, limit, status, studentId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const matches = await Student.find({ $or: [{ "personalInfo.fullName": rx }, { studentId: rx }] }).select("_id");
    filter.studentId = { $in: matches.map((m) => m._id) };
  }

  const [data, total, pendingAgg] = await Promise.all([
    populateFee(HostelFee.find(filter)).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    HostelFee.countDocuments(filter),
    HostelFee.aggregate([
      { $match: { ...filter, status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]),
  ]);

  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, pendingTotal: pendingAgg[0]?.total || 0 };
};

export const listFeesForStudent = (studentId) => populateFee(HostelFee.find({ studentId })).sort("-createdAt");

export const getHostelFeeById = async (id, { userId, isManager }) => {
  const fee = await populateFee(HostelFee.findById(id));
  if (!fee) throw ApiError.notFound("Hostel fee not found.");
  if (!isManager) {
    const student = await Student.findOne({ userId });
    if (!student || String(fee.studentId._id || fee.studentId) !== String(student._id)) {
      throw ApiError.forbidden("You can only view your own hostel fees.");
    }
  }
  return fee;
};

/** Same partial-payment + Transaction/Receipt pattern as Transport's fee (and Library's fine). */
export const payHostelFee = async (id, { amount, paymentMethod }, receivedBy) => {
  const fee = await HostelFee.findById(id);
  if (!fee) throw ApiError.notFound("Hostel fee not found.");
  if (fee.status === "PAID") throw ApiError.conflict("This fee is already fully paid.");
  if (fee.status === "CANCELLED") throw ApiError.conflict("This fee was cancelled.");
  if (amount > fee.dueAmount) throw ApiError.badRequest(`Payment can't exceed the amount due (${fee.dueAmount}).`);

  return withTransaction(async (session) => {
    const paidAt = new Date();
    const receiptNumber = await generateReceiptNumber();

    const newPaid = fee.paidAmount + amount;
    const newDue = Math.max(0, fee.amount - fee.discount + fee.fine - newPaid);
    const updated = await HostelFee.findOneAndUpdate(
      { _id: fee._id, status: fee.status }, // optimistic guard against a concurrent double-payment
      { $set: { paidAmount: newPaid, dueAmount: newDue, status: newDue <= 0 ? "PAID" : "PARTIAL" } },
      { session, new: true }
    );
    if (!updated) throw ApiError.conflict("This fee was just updated by another payment. Please retry.");

    await Transaction.create(
      [{ referenceType: "HOSTEL_FEE", referenceId: fee._id, transactionType: "INCOME", amount, transactionDate: paidAt }],
      { session }
    );
    await Receipt.create(
      [{ receiptNumber, referenceType: "HOSTEL_FEE", referenceId: fee._id, amount, issuedTo: fee.studentId, issuedDate: paidAt }],
      { session }
    );

    return updated;
  });
};

/** Mirrors StudentFee.updateStudentFee (Phase 6): every discount/fine change is appended to
 * `adjustments` with who/when/why, never silently overwritten — "follows the Finance module rules". */
export const adjustHostelFee = async (id, { discount, fine, reason }, changedBy) => {
  const fee = await HostelFee.findById(id);
  if (!fee) throw ApiError.notFound("Hostel fee not found.");
  if (fee.status === "CANCELLED") throw ApiError.conflict("This fee was cancelled.");
  if (fee.status === "PAID") throw ApiError.conflict("This fee is already fully paid and can't be adjusted.");

  if (discount !== undefined && discount !== fee.discount) {
    fee.adjustments.push({ field: "discount", previousValue: fee.discount, newValue: discount, changedBy, reason });
    fee.discount = discount;
  }
  if (fine !== undefined && fine !== fee.fine) {
    fee.adjustments.push({ field: "fine", previousValue: fee.fine, newValue: fine, changedBy, reason });
    fee.fine = fine;
  }

  fee.dueAmount = computeDueAmount(fee);
  fee.status = computeStatus(fee);
  await fee.save();
  return fee;
};
