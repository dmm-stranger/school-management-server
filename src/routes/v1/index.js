import { Router } from "express";
import ApiResponse from "../../shared/ApiResponse.js";
import authRoutes from "../../modules/auth/auth.routes.js";
import userRoutes from "../../modules/user/user.routes.js";
import studentRoutes from "../../modules/student/student.routes.js";
import teacherRoutes from "../../modules/teacher/teacher.routes.js";
import staffRoutes from "../../modules/staff/staff.routes.js";
import guardianRoutes from "../../modules/guardian/guardian.routes.js";
import academyRoutes from "../../modules/academy/academy.routes.js";
import academicYearRoutes from "../../modules/academic-year/academicYear.routes.js";
import classRoutes from "../../modules/class/class.routes.js";
import sectionRoutes from "../../modules/section/section.routes.js";
import groupRoutes from "../../modules/group/group.routes.js";
import subjectRoutes from "../../modules/subject/subject.routes.js";
import teacherAssignmentRoutes from "../../modules/teacher-assignment/teacherAssignment.routes.js";
import studentEnrollmentRoutes from "../../modules/student-enrollment/studentEnrollment.routes.js";
import periodRoutes from "../../modules/period/period.routes.js";
import classRoutineRoutes from "../../modules/class-routine/classRoutine.routes.js";
import examRoutes from "../../modules/exam/exam.routes.js";
import examScheduleRoutes from "../../modules/exam-schedule/examSchedule.routes.js";
import examMarkRoutes from "../../modules/exam-mark/examMark.routes.js";
import examResultRoutes from "../../modules/exam-result/examResult.routes.js";
import studentAttendanceRoutes from "../../modules/student-attendance/studentAttendance.routes.js";
import teacherAttendanceRoutes from "../../modules/teacher-attendance/teacherAttendance.routes.js";
import staffAttendanceRoutes from "../../modules/staff-attendance/staffAttendance.routes.js";
import attendanceSummaryRoutes from "../../modules/attendance-summary/attendanceSummary.routes.js";
import feeStructureRoutes from "../../modules/fee-structure/feeStructure.routes.js";
import studentFeeRoutes from "../../modules/student-fee/studentFee.routes.js";
import paymentRoutes from "../../modules/payment/payment.routes.js";
import salaryStructureRoutes from "../../modules/salary-structure/salaryStructure.routes.js";
import salaryPaymentRoutes from "../../modules/salary-payment/salaryPayment.routes.js";
import expenseRoutes from "../../modules/expense/expense.routes.js";
import transactionRoutes from "../../modules/transaction/transaction.routes.js";
import receiptRoutes from "../../modules/receipt/receipt.routes.js";
import invoiceRoutes from "../../modules/invoice/invoice.routes.js";
import bookCategoryRoutes from "../../modules/book-category/bookCategory.routes.js";
import authorRoutes from "../../modules/author/author.routes.js";
import publisherRoutes from "../../modules/publisher/publisher.routes.js";
import bookRoutes from "../../modules/book/book.routes.js";
import bookCopyRoutes from "../../modules/book-copy/bookCopy.routes.js";
import bookIssueRoutes from "../../modules/book-issue/bookIssue.routes.js";
import libraryFineRoutes from "../../modules/library-fine/libraryFine.routes.js";
import librarySettingRoutes from "../../modules/library-setting/librarySetting.routes.js";
import librarySummaryRoutes from "../../modules/library-summary/librarySummary.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/staff", staffRoutes);
router.use("/guardians", guardianRoutes);
router.use("/academies", academyRoutes);
router.use("/academic-years", academicYearRoutes);
router.use("/classes", classRoutes);
router.use("/sections", sectionRoutes);
router.use("/groups", groupRoutes);
router.use("/subjects", subjectRoutes);
router.use("/teacher-assignments", teacherAssignmentRoutes);
router.use("/student-enrollments", studentEnrollmentRoutes);
router.use("/periods", periodRoutes);
router.use("/class-routines", classRoutineRoutes);
router.use("/exams", examRoutes);
router.use("/exam-schedules", examScheduleRoutes);
router.use("/exam-marks", examMarkRoutes);
router.use("/exam-results", examResultRoutes);
router.use("/student-attendances", studentAttendanceRoutes);
router.use("/teacher-attendances", teacherAttendanceRoutes);
router.use("/staff-attendances", staffAttendanceRoutes);
router.use("/attendance-summary", attendanceSummaryRoutes);
router.use("/fee-structures", feeStructureRoutes);
router.use("/student-fees", studentFeeRoutes);
router.use("/payments", paymentRoutes);
router.use("/salary-structures", salaryStructureRoutes);
router.use("/salary-payments", salaryPaymentRoutes);
router.use("/expenses", expenseRoutes);
router.use("/transactions", transactionRoutes);
router.use("/receipts", receiptRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/book-categories", bookCategoryRoutes);
router.use("/authors", authorRoutes);
router.use("/publishers", publisherRoutes);
router.use("/books", bookRoutes);
router.use("/book-copies", bookCopyRoutes);
router.use("/book-issues", bookIssueRoutes);
router.use("/library-fines", libraryFineRoutes);
router.use("/library-settings", librarySettingRoutes);
router.use("/library-summary", librarySummaryRoutes);

// Health check for the v1 API surface.
// Remaining module routers (transport, hostel, ...) will be
// mounted here in later phases.
router.get("/health", (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { status: "ok" }, "API v1 is healthy"));
});

export default router;
