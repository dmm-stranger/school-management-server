import TransportFee from "./transportFee.model.js";
import Student from "../student/student.model.js";
import Transaction from "../transaction/transaction.model.js";
import Receipt from "../receipt/receipt.model.js";
import ApiError from "../../shared/ApiError.js";
import { withTransaction } from "../../shared/withTransaction.js";
import { generateReceiptNumber } from "../../utils/idGenerator.util.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateFee = (query) =>
  query.populate("studentId", "personalInfo.fullName studentId").populate("routeId", "name");

export const listTransportFees = async ({ page, limit, status, studentId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const matches = await Student.find({ $or: [{ "personalInfo.fullName": rx }, { studentId: rx }] }).select("_id");
    filter.studentId = { $in: matches.map((m) => m._id) };
  }

  const [data, total, pendingAgg] = await Promise.all([
    populateFee(TransportFee.find(filter))
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    TransportFee.countDocuments(filter),
    TransportFee.aggregate([
      { $match: { ...filter, status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]),
  ]);

  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, pendingTotal: pendingAgg[0]?.total || 0 };
};

export const listFeesForStudent = (studentId) => populateFee(TransportFee.find({ studentId })).sort("-createdAt");

export const getTransportFeeById = async (id, { userId, isManager }) => {
  const fee = await populateFee(TransportFee.findById(id));
  if (!fee) throw ApiError.notFound("Transport fee not found.");
  if (!isManager) {
    const student = await Student.findOne({ userId });
    if (!student || String(fee.studentId._id || fee.studentId) !== String(student._id)) {
      throw ApiError.forbidden("You can only view your own transport fees.");
    }
  }
  return fee;
};

/**
 * Supports partial payment, same shape as the fine/fee flows in Phases 8 and 9: a payment
 * always moves the fee's paid/due amounts AND posts a Transaction + Receipt together, or
 * neither happens.
 */
export const payTransportFee = async (id, { amount, paymentMethod }, receivedBy) => {
  const fee = await TransportFee.findById(id);
  if (!fee) throw ApiError.notFound("Transport fee not found.");
  if (fee.status === "PAID") throw ApiError.conflict("This fee is already fully paid.");
  if (fee.status === "CANCELLED") throw ApiError.conflict("This fee was cancelled.");
  if (amount > fee.dueAmount) {
    throw ApiError.badRequest(`Payment can't exceed the amount due (${fee.dueAmount}).`);
  }

  return withTransaction(async (session) => {
    const paidAt = new Date();
    const receiptNumber = await generateReceiptNumber();

    const newPaid = fee.paidAmount + amount;
    const newDue = fee.amount - newPaid;
    const updated = await TransportFee.findOneAndUpdate(
      { _id: fee._id, status: fee.status }, // optimistic guard against a concurrent double-payment
      { $set: { paidAmount: newPaid, dueAmount: newDue, status: newDue <= 0 ? "PAID" : "PARTIAL" } },
      { session, new: true }
    );
    if (!updated) throw ApiError.conflict("This fee was just updated by another payment. Please retry.");

    await Transaction.create(
      [{ referenceType: "TRANSPORT_FEE", referenceId: fee._id, transactionType: "INCOME", amount, transactionDate: paidAt }],
      { session }
    );
    await Receipt.create(
      [{ receiptNumber, referenceType: "TRANSPORT_FEE", referenceId: fee._id, amount, issuedTo: fee.studentId, issuedDate: paidAt }],
      { session }
    );

    return updated;
  });
};
