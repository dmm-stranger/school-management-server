/**
 * Central model registry.
 *
 * Mongoose only registers a schema with mongoose.model(name, schema) when
 * the file that calls it is actually imported somewhere in the running
 * process. Individual modules (auth, student, etc.) only import the models
 * they directly use — so a model that's only ever referenced indirectly via
 * `ref: "..."` in another schema (e.g. Role → Permission, Student → Guardian)
 * can end up NEVER being imported by the running server, even though the
 * seed script imports it fine.
 *
 * Symptom: "Schema hasn't been registered for model 'X'. Use
 * mongoose.model(name, schema)" — thrown at populate() time, not at startup,
 * which makes it easy to miss until that specific populate path runs.
 *
 * Fix: import every model here once, and import THIS file first thing in
 * server.js (before connectDatabase()/app are used). That guarantees every
 * schema is registered exactly once, regardless of which route or service
 * happens to run first.
 *
 * Whenever a new model is added to any module, add it below.
 */

import "../modules/user/user.model.js";
import "../modules/role/role.model.js";
import "../modules/permission/permission.model.js";
import "../modules/session/session.model.js";
import "../modules/auth/otp.model.js";
import "../modules/auth/activityLog.model.js";
import "../modules/student/student.model.js";
import "../modules/teacher/teacher.model.js";
import "../modules/staff/staff.model.js";
import "../modules/guardian/guardian.model.js";
import "../modules/academy/academy.model.js";
import "../modules/academic-year/academicYear.model.js";
import "../modules/class/class.model.js";
import "../modules/section/section.model.js";
import "../modules/group/group.model.js";
import "../modules/subject/subject.model.js";
import "../modules/teacher-assignment/teacherAssignment.model.js";
import "../modules/student-enrollment/studentEnrollment.model.js";
import "../modules/period/period.model.js";
import "../modules/class-routine/classRoutine.model.js";
import "../modules/exam/exam.model.js";
import "../modules/exam-schedule/examSchedule.model.js";
import "../modules/exam-schedule/examInvigilator.model.js";
import "../modules/exam-mark/examMark.model.js";
import "../modules/exam-result/examResult.model.js";
import "../modules/student-attendance/studentAttendance.model.js";
import "../modules/teacher-attendance/teacherAttendance.model.js";
import "../modules/staff-attendance/staffAttendance.model.js";
import "../modules/fee-structure/feeStructure.model.js";
import "../modules/student-fee/studentFee.model.js";
import "../modules/payment/payment.model.js";
import "../modules/salary-structure/salaryStructure.model.js";
import "../modules/salary-payment/salaryPayment.model.js";
import "../modules/expense/expense.model.js";
import "../modules/transaction/transaction.model.js";
import "../modules/receipt/receipt.model.js";
import "../modules/invoice/invoice.model.js";
import "../modules/book-category/bookCategory.model.js";
import "../modules/author/author.model.js";
import "../modules/publisher/publisher.model.js";
import "../modules/book/book.model.js";
import "../modules/book-copy/bookCopy.model.js";
import "../modules/book-issue/bookIssue.model.js";
import "../modules/library-fine/libraryFine.model.js";
import "../modules/library-setting/librarySetting.model.js";
