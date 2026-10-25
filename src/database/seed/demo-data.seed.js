import mongoose from "mongoose";
import dotenv from "dotenv";
import "../models.registry.js";

import databaseConfig from "../../config/database.js";
import logger from "../../config/logger.js";

import User from "../../modules/user/user.model.js";
import Class from "../../modules/class/class.model.js";
import Section from "../../modules/section/section.model.js";
import Group from "../../modules/group/group.model.js";
import Subject from "../../modules/subject/subject.model.js";
import AcademicYear from "../../modules/academic-year/academicYear.model.js";
import Academy from "../../modules/academy/academy.model.js";
import Period from "../../modules/period/period.model.js";

import * as studentService from "../../modules/student/student.service.js";
import * as teacherService from "../../modules/teacher/teacher.service.js";
import * as staffService from "../../modules/staff/staff.service.js";
import * as guardianService from "../../modules/guardian/guardian.service.js";
import * as assignmentService from "../../modules/teacher-assignment/teacherAssignment.service.js";
import * as enrollmentService from "../../modules/student-enrollment/studentEnrollment.service.js";
import * as routineService from "../../modules/class-routine/classRoutine.service.js";
import * as examService from "../../modules/exam/exam.service.js";
import * as scheduleService from "../../modules/exam-schedule/examSchedule.service.js";
import * as markService from "../../modules/exam-mark/examMark.service.js";
import * as resultService from "../../modules/exam-result/examResult.service.js";
import * as attendanceService from "../../modules/student-attendance/studentAttendance.service.js";
import * as feeStructureService from "../../modules/fee-structure/feeStructure.service.js";
import * as studentFeeService from "../../modules/student-fee/studentFee.service.js";
import * as paymentService from "../../modules/payment/payment.service.js";
import * as expenseService from "../../modules/expense/expense.service.js";
import * as bookService from "../../modules/book/book.service.js";
import * as bookIssueService from "../../modules/book-issue/bookIssue.service.js";
import { bookCategoryService } from "../../modules/book-category/bookCategory.crud.js";
import { authorService } from "../../modules/author/author.crud.js";
import { publisherService } from "../../modules/publisher/publisher.crud.js";
import BookCopy from "../../modules/book-copy/bookCopy.model.js";
import BookIssue from "../../modules/book-issue/bookIssue.model.js";
import * as driverService from "../../modules/driver/driver.service.js";
import * as vehicleService from "../../modules/vehicle/vehicle.service.js";
import * as routeService from "../../modules/transport-route/transportRoute.service.js";
import * as stopService from "../../modules/transport-stop/transportStop.service.js";
import * as transportAssignmentService from "../../modules/transport-assignment/transportAssignment.service.js";
import * as transportFeeService from "../../modules/transport-fee/transportFee.service.js";
import Driver from "../../modules/driver/driver.model.js";
import * as hostelService from "../../modules/hostel/hostel.service.js";
import * as hostelRoomService from "../../modules/hostel-room/hostelRoom.service.js";
import * as hostelBedService from "../../modules/hostel-bed/hostelBed.service.js";
import * as hostelAllocationService from "../../modules/hostel-allocation/hostelAllocation.service.js";
import * as hostelFeeService from "../../modules/hostel-fee/hostelFee.service.js";
import * as hostelVisitorService from "../../modules/hostel-visitor/hostelVisitor.service.js";
import Hostel from "../../modules/hostel/hostel.model.js";
import HostelAllocation from "../../modules/hostel-allocation/hostelAllocation.model.js";
import Vehicle from "../../modules/vehicle/vehicle.model.js";
import TransportRoute from "../../modules/transport-route/transportRoute.model.js";
import TransportAssignment from "../../modules/transport-assignment/transportAssignment.model.js";

dotenv.config();

// ---------------------------------------------------------------------------
// This script populates REALISTIC, LINKED sample data across every module
// built so far (Phases 1-11), so the app is immediately explorable after a
// fresh install instead of being empty. It assumes the structural seeds
// (roles, rooms, academic structure, periods, super admin) have already run
// — run `yarn seed` first if you haven't.
//
// Safe to re-run: every creation step checks for an existing record first
// and skips it, so running `yarn seed:demo` twice won't create duplicates
// or error out on unique-index collisions.
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = ["Rahim", "Karim", "Abir", "Fahim", "Nabil", "Sajid", "Tanvir", "Rakib", "Shakil", "Imran"];
const FIRST_NAMES_F = ["Fatima", "Ayesha", "Nusrat", "Sumaiya", "Mim", "Tania", "Rima", "Jannat", "Labiba", "Rupa"];
const LAST_NAMES = ["Islam", "Ahmed", "Rahman", "Hossain", "Chowdhury", "Khan", "Akter", "Uddin", "Sarkar", "Talukder"];

let seq = 0;
const nextName = (gender) => {
  seq += 1;
  const pool = gender === "F" ? FIRST_NAMES_F : FIRST_NAMES_M;
  const first = pool[seq % pool.length];
  const last = LAST_NAMES[(seq * 3) % LAST_NAMES.length];
  return `${first} ${last}`;
};

const randomPhone = () => `01${Math.floor(700000000 + Math.random() * 99999999)}`;
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const getOrThrow = async (model, query, label) => {
  const doc = await model.findOne(query);
  if (!doc) {
    throw new Error(
      `${label} not found (looked up ${JSON.stringify(query)}). Run \`yarn seed\` (structural seeds) before \`yarn seed:demo\`.`
    );
  }
  return doc;
};

const run = async () => {
  await mongoose.connect(databaseConfig.uri);
  logger.info("Connected to MongoDB for demo data seeding.");

  // ---- Prerequisites from structural seeds ----
  const academicYear =
    (await AcademicYear.findOne({ status: "ACTIVE" })) || (await AcademicYear.findOne().sort("-year"));
  if (!academicYear) {
    throw new Error("No academic year found. Run `yarn seed:academic` (or full `yarn seed`) first.");
  }
  // Ensure it's ACTIVE so enrollment/routine/exam rules relying on "one active year" behave predictably.
  if (academicYear.status !== "ACTIVE") {
    await AcademicYear.updateMany({ status: "ACTIVE" }, { status: "INACTIVE" });
    academicYear.status = "ACTIVE";
    await academicYear.save();
  }

  const class6 = await getOrThrow(Class, { level: 6 }, "Class 6");
  const class9 = await getOrThrow(Class, { level: 9 }, "Class 9");
  const sectionA6 = await getOrThrow(Section, { classId: class6._id, name: "A" }, "Class 6 Section A");
  const sectionA9 = await getOrThrow(Section, { classId: class9._id, name: "A" }, "Class 9 Section A");
  const scienceGroup = await getOrThrow(Group, { name: "Science" }, "Science group");

  const subjects6 = await Subject.find({ classId: class6._id, isDeleted: false });
  const subjects9Common = await Subject.find({ classId: class9._id, group: null, isDeleted: false });
  const subjects9Science = await Subject.find({ classId: class9._id, group: scienceGroup._id, isDeleted: false });
  if (subjects6.length === 0 || subjects9Common.length === 0) {
    throw new Error("No subjects found for Class 6 / Class 9. Run `yarn seed:academic` first.");
  }

  const classroom = await getOrThrow(
    Academy,
    { roomType: "CLASSROOM", buildingName: "ACA-RED" },
    "A classroom in ACA-RED"
  );
  const secondClassroom =
    (await Academy.findOne({ roomType: "CLASSROOM", buildingName: "ACA-RED", _id: { $ne: classroom._id } })) ||
    classroom;

  const periodCount = await Period.countDocuments();
  if (periodCount === 0) {
    throw new Error("No periods found. Run `yarn seed:periods` first.");
  }

  const superAdmin = await getOrThrow(User, { accountStatus: "ACTIVE" }, "An active admin user (for markedBy/receivedBy fields)");

  logger.info(`Using academic year ${academicYear.year}, Class 6 Section A, Class 9 Section A (Science).`);

  // =========================================================================
  // 1. TEACHERS (5) — one becomes Class 6-A's class teacher
  // =========================================================================
  const teachers = [];
  for (let i = 0; i < 5; i++) {
    const email = `teacher${i + 1}@schoolerp.demo`;
    let user = await User.findOne({ email });
    let teacherDoc;
    if (user && user.profileId) {
      teacherDoc = await mongoose.model("Teacher").findById(user.profileId);
    } else {
      const fullName = nextName(i % 2 === 0 ? "M" : "F");
      teacherDoc = await teacherService.createTeacher({
        email,
        password: "Teacher@123",
        personalInfo: {
          fullName,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          dateOfBirth: new Date(1985 + i, i, 10),
        },
        contactInfo: { phone: randomPhone(), presentAddress: "Dhaka, Bangladesh" },
        academicInfo: { highestQualification: "M.Ed", institution: "University of Dhaka" },
        experience: 3 + i,
      });
    }
    teachers.push(teacherDoc);
  }
  logger.info(`Ensured ${teachers.length} demo teachers exist.`);

  // =========================================================================
  // 2. STAFF (3)
  // =========================================================================
  const staffDesignations = ["Accountant", "Librarian", "Receptionist"];
  for (let i = 0; i < staffDesignations.length; i++) {
    const email = `staff${i + 1}@schoolerp.demo`;
    const existing = await User.findOne({ email });
    if (existing) continue;
    await staffService.createStaff({
      email,
      password: "Staff@123",
      designation: staffDesignations[i],
      personalInfo: {
        fullName: nextName(i % 2 === 0 ? "F" : "M"),
        gender: i % 2 === 0 ? "FEMALE" : "MALE",
        dateOfBirth: new Date(1988 + i, i + 1, 15),
      },
      contactInfo: { phone: randomPhone(), presentAddress: "Dhaka, Bangladesh" },
      experience: 2 + i,
    });
  }
  logger.info(`Ensured ${staffDesignations.length} demo staff exist.`);

  // =========================================================================
  // 3. GUARDIANS + STUDENTS (18 total: 10 in Class 6-A, 8 in Class 9-A Science)
  // =========================================================================
  const classCohorts = [
    { klass: class6, section: sectionA6, group: null, count: 10, prefix: "c6" },
    { klass: class9, section: sectionA9, group: scienceGroup, count: 8, prefix: "c9" },
  ];

  const enrolledStudents = { c6: [], c9: [] };

  for (const cohort of classCohorts) {
    for (let i = 0; i < cohort.count; i++) {
      const email = `student.${cohort.prefix}.${i + 1}@schoolerp.demo`;
      let user = await User.findOne({ email });
      let studentDoc;

      if (user && user.profileId) {
        studentDoc = await mongoose.model("Student").findById(user.profileId);
      } else {
        const gender = i % 2 === 0 ? "MALE" : "FEMALE";
        const fullName = nextName(gender);

        const guardian = await guardianService.createGuardian({
          fatherName: `${nextName("M")}`,
          motherName: `${nextName("F")}`,
          phone: randomPhone(),
          occupation: "Business",
          address: "Dhaka, Bangladesh",
        });

        studentDoc = await studentService.createStudent({
          email,
          password: "Student@123",
          personalInfo: { fullName, gender, dateOfBirth: new Date(2012 - cohort.klass.level, i, 5) },
          contactInfo: { phone: randomPhone(), presentAddress: "Dhaka, Bangladesh" },
          guardianInfo: { guardianId: guardian._id, relation: "FATHER" },
        });
      }

      // Enroll (skip if already enrolled this year)
      const existingEnrollment = await mongoose.model("StudentEnrollment").findOne({
        studentId: studentDoc._id,
        academicYearId: academicYear._id,
        status: "ACTIVE",
      });

      let enrollment = existingEnrollment;
      if (!existingEnrollment) {
        enrollment = await enrollmentService.createEnrollment({
          studentId: studentDoc._id,
          academicYearId: academicYear._id,
          classId: cohort.klass._id,
          sectionId: cohort.section._id,
          groupId: cohort.group?._id,
          rollNumber: String(i + 1).padStart(2, "0"),
        });
      }

      enrolledStudents[cohort.prefix].push({ student: studentDoc, enrollment });
    }
  }
  logger.info(
    `Ensured ${enrolledStudents.c6.length} students enrolled in Class 6-A, ${enrolledStudents.c9.length} in Class 9-A (Science).`
  );

  // =========================================================================
  // 4. TEACHER ASSIGNMENTS — 5 teachers × 5 subjects for Class 6-A; teacher[0] is class teacher
  // =========================================================================
  const assignments6 = [];
  for (let i = 0; i < Math.min(5, subjects6.length, teachers.length); i++) {
    const existing = await mongoose.model("TeacherAssignment").findOne({
      teacherId: teachers[i]._id,
      academicYearId: academicYear._id,
      classId: class6._id,
      sectionId: sectionA6._id,
      subjectId: subjects6[i]._id,
    });
    const assignment =
      existing ||
      (await assignmentService.createAssignment({
        teacherId: teachers[i]._id,
        academicYearId: academicYear._id,
        classId: class6._id,
        sectionId: sectionA6._id,
        subjectId: subjects6[i]._id,
        isClassTeacher: i === 0,
      }));
    assignments6.push(assignment);
  }
  logger.info(`Ensured ${assignments6.length} teacher assignments for Class 6-A.`);

  // =========================================================================
  // 5. ROUTINE — generate + publish for Class 6-A
  // =========================================================================
  const existingRoutineCount = await mongoose.model("ClassRoutine").countDocuments({
    academicYearId: academicYear._id,
    classId: class6._id,
    sectionId: sectionA6._id,
  });

  if (existingRoutineCount === 0) {
    const genResult = await routineService.generateRoutine({
      academicYearId: academicYear._id,
      classId: class6._id,
      sectionId: sectionA6._id,
      roomId: classroom._id,
    });
    logger.info(`Generated ${genResult.created.length} routine entries for Class 6-A.`);

    const conflicts = await routineService.checkConflicts({
      academicYearId: academicYear._id,
      classId: class6._id,
      sectionId: sectionA6._id,
    });
    if (conflicts.length === 0) {
      const pub = await routineService.publishRoutine({
        academicYearId: academicYear._id,
        classId: class6._id,
        sectionId: sectionA6._id,
      });
      logger.info(`Published ${pub.published} routine entries for Class 6-A.`);
    } else {
      logger.warn(`Routine for Class 6-A has ${conflicts.length} conflict(s), left unpublished.`);
    }
  } else {
    logger.info("Routine for Class 6-A already exists, skipping generation.");
  }

  // =========================================================================
  // 6. EXAM — one exam, schedules for 3 subjects, marks for all students, published results
  // =========================================================================
  let exam = await mongoose.model("Exam").findOne({
    academicYearId: academicYear._id,
    examName: "Monthly Test - Demo",
  });
  if (!exam) {
    exam = await examService.createExam({
      academicYearId: academicYear._id,
      examName: "Monthly Test - Demo",
      examType: "Monthly Test",
      startDate: daysAgo(10),
      endDate: daysAgo(8),
    });
  }

  const examSubjects = subjects6.slice(0, 3);
  const schedules = [];
  for (let i = 0; i < examSubjects.length; i++) {
    let schedule = await mongoose.model("ExamSchedule").findOne({
      examId: exam._id,
      classId: class6._id,
      sectionId: sectionA6._id,
      subjectId: examSubjects[i]._id,
    });
    if (!schedule) {
      schedule = await scheduleService.createSchedule({
        examId: exam._id,
        classId: class6._id,
        sectionId: sectionA6._id,
        subjectId: examSubjects[i]._id,
        examDate: daysAgo(9),
        startTime: `${9 + i}:00`.padStart(5, "0"),
        endTime: `${10 + i}:00`.padStart(5, "0"),
        roomId: secondClassroom._id,
        fullMarks: 100,
        passMarks: 33,
      });
      // Finalize immediately so marks entry is allowed (spec requires non-DRAFT).
      schedule.status = "COMPLETED";
      await schedule.save();
    }
    schedules.push(schedule);
  }
  logger.info(`Ensured exam "${exam.examName}" with ${schedules.length} schedules.`);

  for (const schedule of schedules) {
    const existingMarksCount = await mongoose.model("ExamMark").countDocuments({ examScheduleId: schedule._id });
    if (existingMarksCount > 0) continue;

    const marks = enrolledStudents.c6.map(({ student }, idx) => ({
      studentId: student._id,
      obtainedMarks: 55 + ((idx * 7 + schedules.indexOf(schedule) * 3) % 40), // varied realistic scores 55-94
    }));
    await markService.bulkCreateMarks({ examScheduleId: schedule._id, marks }, superAdmin._id);
  }
  logger.info("Ensured marks entered for all Class 6-A students across all demo exam schedules.");

  const existingResultsCount = await mongoose.model("ExamResult").countDocuments({ examId: exam._id });
  if (existingResultsCount === 0) {
    const genRes = await resultService.generateResults({
      academicYearId: academicYear._id,
      examId: exam._id,
      classId: class6._id,
      sectionId: sectionA6._id,
    });
    logger.info(`Generated results for ${genRes.generated} students.`);
    const pubRes = await resultService.publishResults({ examId: exam._id });
    logger.info(`Published ${pubRes.published} results.`);
  } else {
    logger.info("Exam results already exist, skipping generation.");
  }

  // =========================================================================
  // 7. ATTENDANCE — last 10 weekdays for Class 6-A, mostly present with a few absent/late
  // =========================================================================
  let attendanceDaysCreated = 0;
  for (let d = 1; d <= 14; d++) {
    const date = daysAgo(d);
    const dayOfWeek = date.getDay(); // 0=Sun..6=Sat; skip Fri(5) as the day off
    if (dayOfWeek === 5) continue;

    const existingCount = await mongoose.model("StudentAttendance").countDocuments({
      classId: class6._id,
      sectionId: sectionA6._id,
      date: { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(24, 0, 0, 0)) },
    });
    if (existingCount > 0) continue;

    const entries = enrolledStudents.c6.map(({ student }, idx) => {
      let attendanceStatus = "PRESENT";
      if (idx === 2 && d % 4 === 0) attendanceStatus = "ABSENT";
      else if (idx === 5 && d % 3 === 0) attendanceStatus = "LATE";
      return { studentId: student._id, attendanceStatus };
    });

    await attendanceService.bulkCreateAttendance(
      {
        academicYearId: academicYear._id,
        classId: class6._id,
        sectionId: sectionA6._id,
        date,
        entries,
      },
      superAdmin._id
    );
    attendanceDaysCreated += 1;
    if (attendanceDaysCreated >= 10) break;
  }
  logger.info(`Ensured attendance recorded for ${attendanceDaysCreated} school days in Class 6-A.`);

  // =========================================================================
  // 8. FINANCE — fee structure for Class 6, assign to all students, pay some in full/partial
  // =========================================================================
  let feeStructure = await mongoose.model("FeeStructure").findOne({
    academicYearId: academicYear._id,
    classId: class6._id,
    name: "Tuition Fee - Term 1 (Demo)",
  });
  if (!feeStructure) {
    feeStructure = await feeStructureService.createFeeStructure({
      name: "Tuition Fee - Term 1 (Demo)",
      academicYearId: academicYear._id,
      classId: class6._id,
      amount: 5000,
      description: "Demo tuition fee for Term 1.",
    });
  }

  let feesCreated = 0;
  let paymentsRecorded = 0;
  for (let i = 0; i < enrolledStudents.c6.length; i++) {
    const { student } = enrolledStudents.c6[i];
    let studentFee = await mongoose.model("StudentFee").findOne({
      studentId: student._id,
      feeStructureId: feeStructure._id,
    });
    if (!studentFee) {
      const created = await studentFeeService.createStudentFee({
        studentId: student._id,
        academicYearId: academicYear._id,
        feeStructureId: feeStructure._id,
      });
      studentFee = await mongoose.model("StudentFee").findById(created._id);
      feesCreated += 1;
    }
    if (!studentFee || studentFee.dueAmount <= 0) continue;

    // First 6 students pay in full, next 2 pay half, rest remain unpaid — realistic spread.
    if (i < 6) {
      await paymentService.createPayment(
        { studentFeeId: studentFee._id, paymentMethod: "CASH", amount: studentFee.dueAmount },
        superAdmin._id
      );
      paymentsRecorded += 1;
    } else if (i < 8) {
      await paymentService.createPayment(
        { studentFeeId: studentFee._id, paymentMethod: "MOBILE_BANKING", amount: Math.floor(studentFee.dueAmount / 2) },
        superAdmin._id
      );
      paymentsRecorded += 1;
    }
  }
  logger.info(`Ensured fee assigned to ${feesCreated} new students; recorded ${paymentsRecorded} payments.`);

  // A couple of sample expenses
  const expenseSeeds = [
    { category: "Electric Bill", amount: 12000, description: "Monthly electricity bill (demo)." },
    { category: "Stationery", amount: 3500, description: "Office and classroom stationery (demo)." },
  ];
  let expensesCreated = 0;
  for (const exp of expenseSeeds) {
    const existing = await mongoose.model("Expense").findOne({ category: exp.category, description: exp.description });
    if (existing) continue;
    await expenseService.createExpense(exp, superAdmin._id);
    expensesCreated += 1;
  }
  logger.info(`Ensured ${expensesCreated} demo expenses recorded.`);

  // ---------------------------------------------------------------------------
  // 9. LIBRARY — catalog + copies, then a scripted spread of issue/return states
  // ---------------------------------------------------------------------------
  // Everything below goes through the REAL services (issue/return/fine flows), so
  // this section doubles as an end-to-end test of the Phase 9 transactions.
  const findOrCreateLookup = async (svc, Model, payload) => {
    const existing = await Model.findOne({ name: payload.name, isDeleted: false });
    return existing || svc.create(payload, superAdmin._id);
  };
  const BookModel = mongoose.model("Book");

  const demoCategories = {};
  for (const name of ["Textbook", "Science", "Fiction", "Reference", "Biography"]) {
    demoCategories[name] = await findOrCreateLookup(bookCategoryService, mongoose.model("BookCategory"), { name });
  }
  const demoAuthors = {};
  for (const name of ["Dr. Anwar Hossain", "Nasrin Sultana", "Humayun Ahmed", "Rafiq Uddin", "Selina Rahman"]) {
    demoAuthors[name] = await findOrCreateLookup(authorService, mongoose.model("Author"), { name });
  }
  const demoPublisher = await findOrCreateLookup(publisherService, mongoose.model("Publisher"), {
    name: "National Curriculum Press",
  });

  const demoBooks = [
    { title: "Mathematics - Class 6", isbn: "9780000000101", cat: "Textbook", author: "Dr. Anwar Hossain", price: 220, copies: 4, shelf: "Shelf A1" },
    { title: "General Science - Class 6", isbn: "9780000000102", cat: "Science", author: "Nasrin Sultana", price: 240, copies: 4, shelf: "Shelf A2" },
    { title: "Bangla Literature Reader", isbn: "9780000000103", cat: "Fiction", author: "Humayun Ahmed", price: 180, copies: 3, shelf: "Shelf B1" },
    { title: "Oxford Student Dictionary", isbn: "9780000000104", cat: "Reference", author: "Rafiq Uddin", price: 650, copies: 2, shelf: "Reference Desk" },
    { title: "Lives of Great Scientists", isbn: "9780000000105", cat: "Biography", author: "Selina Rahman", price: 300, copies: 3, shelf: "Shelf C2" },
  ];

  const libraryBooks = [];
  let booksCreated = 0;
  for (const b of demoBooks) {
    let book = await BookModel.findOne({ isbn: b.isbn, isDeleted: false });
    if (!book) {
      book = await bookService.createBook(
        {
          title: b.title,
          isbn: b.isbn,
          categoryId: demoCategories[b.cat]._id,
          authorIds: [demoAuthors[b.author]._id],
          publisherId: demoPublisher._id,
          shelfLocation: b.shelf,
          price: b.price,
          publishedYear: 2024,
          initialCopies: b.copies,
        },
        superAdmin._id
      );
      booksCreated += 1;
    }
    libraryBooks.push(book);
  }
  logger.info(`Ensured ${libraryBooks.length} library books (${booksCreated} newly created, with copies).`);

  // Only script loans if none exist yet, so re-runs don't stack extra loans on the same copies.
  if ((await BookIssue.countDocuments()) === 0 && enrolledStudents.c6.length >= 5) {
    const availableCopy = async (book) => BookCopy.findOne({ bookId: book._id, status: "AVAILABLE", isDeleted: false }).sort("barcode");
    const borrowerOf = (i) => enrolledStudents.c6[i].student.userId;
    const backdate = async (issueId, dueDaysAgo) =>
      // Simulation only: real loans can't be backdated via the API, but a demo needs overdue examples.
      BookIssue.updateOne({ _id: issueId }, { $set: { dueDate: daysAgo(dueDaysAgo), issueDate: daysAgo(dueDaysAgo + 14) } });

    // 0: healthy active loan
    let issued = await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[0])).barcode, borrowerId: borrowerOf(0) }, superAdmin._id);

    // 1: OVERDUE active loan (still out, 5 days late)
    issued = await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[1])).barcode, borrowerId: borrowerOf(1) }, superAdmin._id);
    await backdate(issued._id, 5);

    // 2: returned on time (clean history)
    issued = await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[2])).barcode, borrowerId: borrowerOf(2) }, superAdmin._id);
    await bookIssueService.returnBook(issued._id, { condition: "GOOD" }, superAdmin._id);

    // 3: returned 6 days late -> real OVERDUE fine computed by the service (left PENDING)
    issued = await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[4])).barcode, borrowerId: borrowerOf(3) }, superAdmin._id);
    await backdate(issued._id, 6);
    await bookIssueService.returnBook(issued._id, { condition: "GOOD" }, superAdmin._id);

    // 4: returned damaged with a damage fine (copy becomes DAMAGED)
    issued = await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[3])).barcode, borrowerId: borrowerOf(4) }, superAdmin._id);
    await bookIssueService.returnBook(issued._id, { condition: "DAMAGED", damageFine: 100, remarks: "Torn cover (demo)." }, superAdmin._id);

    // A teacher borrows too (longer loan period)
    if (teachers.length) {
      await bookIssueService.issueBook({ barcode: (await availableCopy(libraryBooks[0])).barcode, borrowerId: teachers[0].userId }, superAdmin._id);
    }
    logger.info("Ensured demo library loans: 1 active, 1 overdue, 1 clean return, 1 late return (fine), 1 damaged return (fine), 1 teacher loan.");
    logger.info("Note: student 4 (damaged) and student 3 (late) now have PENDING fines and are blocked from new loans until settled - by design.");
  } else {
    logger.info("Library loans already exist - skipping scripted loan history.");
  }

  // ---------------------------------------------------------------------------
  // 10. TRANSPORT — drivers, vehicles, a route with stops, then student assignments
  // ---------------------------------------------------------------------------
  // Runs through the REAL services, same as Library above — doubles as an end-to-end
  // test of the seat-capacity claim and the fee-generated-from-route transaction.
  let driverOne = await Driver.findOne({ licenseNumber: "DL-DEMO-1001" });
  if (!driverOne) driverOne = await driverService.createDriver(
    { name: "Abdul Karim", phone: "01711000001", licenseNumber: "DL-DEMO-1001" },
    superAdmin._id
  );
  let driverTwo = await Driver.findOne({ licenseNumber: "DL-DEMO-1002" });
  if (!driverTwo) driverTwo = await driverService.createDriver(
    { name: "Josna Begum", phone: "01711000002", licenseNumber: "DL-DEMO-1002" },
    superAdmin._id
  );

  let vehicleOne = await Vehicle.findOne({ vehicleNumber: "DHAKA-METRO-GA-1234" });
  if (!vehicleOne) vehicleOne = await vehicleService.createVehicle(
    { vehicleNumber: "Dhaka Metro Ga 1234", type: "BUS", seatCapacity: 3, driverId: driverOne._id },
    superAdmin._id
  ); // deliberately small capacity so the demo also shows the "vehicle full" rule in action
  let vehicleTwo = await Vehicle.findOne({ vehicleNumber: "DHAKA-METRO-GA-5678" });
  if (!vehicleTwo) vehicleTwo = await vehicleService.createVehicle(
    { vehicleNumber: "Dhaka Metro Ga 5678", type: "MICROBUS", seatCapacity: 10, driverId: driverTwo._id },
    superAdmin._id
  );
  logger.info(`Ensured 2 drivers and 2 vehicles (capacities ${vehicleOne.seatCapacity} and ${vehicleTwo.seatCapacity}).`);

  let routeOne = await TransportRoute.findOne({ name: "Route A - Uttara" });
  if (!routeOne) {
    routeOne = await routeService.createRoute(
      { name: "Route A - Uttara", vehicleId: vehicleOne._id, fee: 1500, feeFrequency: "MONTHLY" },
      superAdmin._id
    );
    await stopService.createStop({ routeId: routeOne._id, name: "Sector 7 Gate", sequence: 1, pickupTime: "07:00" });
    await stopService.createStop({ routeId: routeOne._id, name: "House Building", sequence: 2, pickupTime: "07:15" });
    await stopService.createStop({ routeId: routeOne._id, name: "School Gate", sequence: 3, pickupTime: "07:40" });
  }
  const routeOneStops = await stopService.listStopsForRoute(routeOne._id);
  logger.info(`Ensured Route A - Uttara with ${routeOneStops.length} ordered stops.`);

  if ((await TransportAssignment.countDocuments()) === 0 && enrolledStudents.c6.length >= 4) {
    const assign = (i, stopIdx) =>
      transportAssignmentService.createAssignment(
        { studentId: enrolledStudents.c6[i].student._id, routeId: routeOne._id, stopId: routeOneStops[stopIdx]._id },
        superAdmin._id
      );

    // Fills the 3-seat vehicle exactly, then proves the 4th assignment is correctly rejected.
    await assign(0, 0);
    await assign(1, 1);
    const third = await assign(2, 2);

    try {
      await assign(3, 0);
      logger.warn("Expected the 4th transport assignment to be rejected (vehicle full) but it succeeded.");
    } catch {
      logger.info(`Confirmed: ${vehicleOne.vehicleNumber} correctly rejects a 4th student once its 3 seats are full.`);
    }

    // Pay one of the generated fees in full, leave the others pending — mirrors Library's
    // "some settled, some outstanding" demo spread.
    const feesForThird = await transportFeeService.listFeesForStudent(enrolledStudents.c6[2].student._id);
    if (feesForThird[0]) {
      await transportFeeService.payTransportFee(feesForThird[0]._id, { amount: feesForThird[0].amount, paymentMethod: "CASH" }, superAdmin._id);
    }
    logger.info("Ensured 3 demo transport assignments (seats full) with transport fees generated; 1 fee paid, 2 left pending.");
  } else {
    logger.info("Transport assignments already exist - skipping scripted assignment history.");
  }

  // ---------------------------------------------------------------------------
  // 11. HOSTEL — a boys and a girls hostel, rooms, beds, allocations, a fee and a visitor
  // ---------------------------------------------------------------------------
  // Runs through the REAL services, same as Library and Transport above — doubles as an
  // end-to-end test of the bed-capacity claim, the gender/hostel-type check, and the
  // fee-generated-from-hostel transaction.
  let boysHostel = await Hostel.findOne({ name: "North Hostel (Boys)" });
  if (!boysHostel) boysHostel = await hostelService.createHostel({ name: "North Hostel (Boys)", type: "BOYS", fee: 3000, feeFrequency: "MONTHLY" }, superAdmin._id);
  let girlsHostel = await Hostel.findOne({ name: "South Hostel (Girls)" });
  if (!girlsHostel) girlsHostel = await hostelService.createHostel({ name: "South Hostel (Girls)", type: "GIRLS", fee: 3200, feeFrequency: "MONTHLY" }, superAdmin._id);
  logger.info(`Ensured 2 demo hostels: ${boysHostel.name} and ${girlsHostel.name}.`);

  let boysRoom = await hostelRoomService.listRoomsForHostel(boysHostel._id).then((r) => r[0]);
  if (!boysRoom) boysRoom = await hostelRoomService.createRoom({ hostelId: boysHostel._id, roomNumber: "101", floor: "1st" });
  let boysBeds = await hostelBedService.listBedsForRoom(boysRoom._id);
  if (boysBeds.length === 0) boysBeds = await hostelBedService.createBeds({ roomId: boysRoom._id, bedNumbers: ["A", "B"] }); // 2 beds only, so the demo can also show "bed full"

  let girlsRoom = await hostelRoomService.listRoomsForHostel(girlsHostel._id).then((r) => r[0]);
  if (!girlsRoom) girlsRoom = await hostelRoomService.createRoom({ hostelId: girlsHostel._id, roomNumber: "201", floor: "2nd" });
  let girlsBeds = await hostelBedService.listBedsForRoom(girlsRoom._id);
  if (girlsBeds.length === 0) girlsBeds = await hostelBedService.createBeds({ roomId: girlsRoom._id, bedNumbers: ["A", "B"] });
  logger.info(`Ensured 1 room with 2 beds in each hostel.`);

  if ((await HostelAllocation.countDocuments()) === 0 && enrolledStudents.c6.length >= 5) {
    // c6[0], c6[2], c6[4] are MALE; c6[1], c6[3] are FEMALE (see the student-creation loop above).
    const male = (i) => enrolledStudents.c6[i].student;
    const female = (i) => enrolledStudents.c6[i].student;

    // Fills the 2-bed boys room exactly.
    await hostelAllocationService.createAllocation({ studentId: male(0)._id, roomId: boysRoom._id, bedId: boysBeds[0]._id }, superAdmin._id);
    await hostelAllocationService.createAllocation({ studentId: male(2)._id, roomId: boysRoom._id, bedId: boysBeds[1]._id }, superAdmin._id);

    try {
      await hostelAllocationService.createAllocation({ studentId: male(4)._id, roomId: boysRoom._id, bedId: boysBeds[0]._id }, superAdmin._id);
      logger.warn("Expected a 3rd boys-room allocation to be rejected (room full) but it succeeded.");
    } catch {
      logger.info(`Confirmed: ${boysRoom.roomNumber} correctly rejects a 3rd student once its 2 beds are full.`);
    }

    try {
      await hostelAllocationService.createAllocation({ studentId: male(4)._id, roomId: girlsRoom._id, bedId: girlsBeds[0]._id }, superAdmin._id);
      logger.warn("Expected a male student's allocation to a girls hostel to be rejected but it succeeded.");
    } catch {
      logger.info(`Confirmed: ${girlsHostel.name} correctly rejects a male student.`);
    }

    // One girl correctly allocated.
    await hostelAllocationService.createAllocation({ studentId: female(1)._id, roomId: girlsRoom._id, bedId: girlsBeds[0]._id }, superAdmin._id);

    // Pay one of the generated fees in full, leave the rest pending — same "some settled, some
    // outstanding" spread as the Library and Transport demo data.
    const feesForSecondBoy = await hostelFeeService.listFeesForStudent(male(2)._id);
    if (feesForSecondBoy[0]) {
      await hostelFeeService.payHostelFee(feesForSecondBoy[0]._id, { amount: feesForSecondBoy[0].amount, paymentMethod: "CASH" }, superAdmin._id);
    }

    // A visitor currently on site (no checkout yet), so the summary's "visitors on site" count is non-zero.
    await hostelVisitorService.logVisitor(
      { studentId: male(0)._id, visitorName: "Mr. Kamal Hossain", relation: "Father", purpose: "Weekly visit" },
      superAdmin._id
    );

    logger.info("Ensured 3 demo hostel allocations (boys room full, 1 girl) with hostel fees generated; 1 fee paid, rest pending; 1 visitor on site.");
  } else {
    logger.info("Hostel allocations already exist - skipping scripted allocation history.");
  }

  // ---------------------------------------------------------------------------
  logger.info("\n✅ Demo data seeding complete.");
  logger.info("Login as any demo student/teacher with their email + the password shown above,");
  logger.info("or log in as your super admin to browse everything created.");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Demo data seeding failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
