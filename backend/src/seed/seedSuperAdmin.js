const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const School = require('../models/school.model');
const AcademicSession = require('../models/academicSession.model');
const Term = require('../models/term.model');
const SchoolClass = require('../models/class.model');
const Section = require('../models/section.model');
const Subject = require('../models/subject.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const Student = require('../models/student.model');
const StudentEnrollment = require('../models/studentEnrollment.model');
const ParentStudent = require('../models/parentStudent.model');
const StudentCard = require('../models/studentCard.model');
const TeacherProfile = require('../models/teacherProfile.model');
const AttendanceSession = require('../models/attendanceSession.model');
const AttendanceRecord = require('../models/attendanceRecord.model');
const Homework = require('../models/homework.model');
const Examination = require('../models/examination.model');
const ExamSubject = require('../models/examSubject.model');
const ExamMark = require('../models/examMark.model');
const FeeStructure = require('../models/feeStructure.model');
const FeeInvoice = require('../models/feeInvoice.model');
const FeePayment = require('../models/feePayment.model');
const Notice = require('../models/notice.model');

const seedData = async () => {
  try {
    // Database connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 1. Check if Super Admin already exists
    const superAdminExists = await User.findOne({ role: 'superAdmin' });

    if (superAdminExists) {
      console.log('ℹ️ Super Admin already exists. Skipping...');
    } else {
      // Create Super Admin
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@school.com',
        phone: '03001234567',
        password: 'password123',
        role: 'superAdmin',
        isActive: true,
      });
      console.log('✅ Super Admin created: superadmin@school.com / password123');
    }

    // 2. Create a Demo School
    let demoSchool = await School.findOne({ email: 'demo@school.com' });

    if (!demoSchool) {
      demoSchool = await School.create({
        name: 'City Model School Piplan',
        address: 'Main Bazaar, Piplan, Mianwali',
        phone: '0459-123456',
        email: 'demo@school.com',
        status: 'active',
      });
      console.log('✅ Demo School created: City Model School Piplan');
    }

    // 3. Create a Demo Admin for this School
    const adminExists = await User.findOne({ email: 'admin@school.com' });
    if (!adminExists) {
      await User.create({
        name: 'School Admin',
        email: 'admin@school.com',
        phone: '03007654321',
        password: 'password123',
        role: 'admin',
        schoolId: demoSchool._id,
        isActive: true,
      });
      console.log('✅ Demo Admin created: admin@school.com / password123');
    }

    // 4. Create a Demo Teacher
    let demoTeacher = await User.findOne({ email: 'teacher@school.com' });
    if (!demoTeacher) {
      demoTeacher = await User.create({
        name: 'Arslan Teacher',
        email: 'teacher@school.com',
        phone: '03123456789',
        password: 'password123',
        role: 'teacher',
        schoolId: demoSchool._id,
        isActive: true,
      });
      console.log('✅ Demo Teacher created: teacher@school.com / password123');
    }
    await TeacherProfile.updateOne(
      { schoolId: demoSchool._id, userId: demoTeacher._id },
      {
        $setOnInsert: {
          employeeId: 'TCH-001',
          gender: 'male',
          qualification: 'MSc Mathematics',
          specialization: 'Mathematics',
          joiningDate: new Date('2025-04-01'),
          address: 'Piplan, Mianwali',
          employmentType: 'permanent',
          createdBy: demoTeacher.createdBy || demoTeacher._id,
        },
      },
      { upsert: true }
    );

    // 5. Create a Demo Parent
    let demoParent = await User.findOne({ email: 'parent@school.com' });
    if (!demoParent) {
      demoParent = await User.create({
        name: 'Malik Parent',
        email: 'parent@school.com',
        phone: '03219876543',
        password: 'password123',
        role: 'parent',
        schoolId: demoSchool._id,
        isActive: true,
      });
      console.log('✅ Demo Parent created: parent@school.com / password123');
    }

    // 6. Academic Foundation demo data (idempotent)
    const admin = await User.findOne({ email: 'admin@school.com' });
    let session = await AcademicSession.findOne({
      schoolId: demoSchool._id,
      name: '2026-2027',
    });
    if (!session) {
      await AcademicSession.updateMany(
        { schoolId: demoSchool._id, isCurrent: true },
        { $set: { isCurrent: false } }
      );
      session = await AcademicSession.create({
        schoolId: demoSchool._id,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'active',
        createdBy: admin._id,
      });
    }
    await AcademicSession.updateMany(
      { schoolId: demoSchool._id, _id: { $ne: session._id }, isCurrent: true },
      { $set: { isCurrent: false } }
    );
    await AcademicSession.updateOne(
      { _id: session._id },
      { $set: { isCurrent: true, status: 'active' } }
    );

    const termDefaults = [
      ['First Term', '2026-04-01', '2026-07-31'],
      ['Second Term', '2026-08-01', '2026-11-30'],
      ['Final Term', '2026-12-01', '2027-03-31'],
    ];
    for (const [name, startDate, endDate] of termDefaults) {
      await Term.updateOne(
        { schoolId: demoSchool._id, academicSessionId: session._id, name },
        {
          $setOnInsert: {
            startDate: new Date(startDate), endDate: new Date(endDate),
            status: 'draft', createdBy: admin._id,
          },
        },
        { upsert: true }
      );
    }

    const classNames = ['Nursery', 'Prep', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
    const classRecords = [];
    for (let index = 0; index < classNames.length; index += 1) {
      const record = await SchoolClass.findOneAndUpdate(
        { schoolId: demoSchool._id, academicSessionId: session._id, name: classNames[index] },
        { $setOnInsert: { displayOrder: index, createdBy: admin._id } },
        { upsert: true, new: true }
      );
      classRecords.push(record);
    }

    for (const schoolClass of classRecords) {
      for (const name of ['A', 'B']) {
        await Section.updateOne(
          { schoolId: demoSchool._id, academicSessionId: session._id, classId: schoolClass._id, name },
          { $setOnInsert: { createdBy: admin._id } },
          { upsert: true }
        );
      }
    }

    const subjectDefaults = [
      ['English', 'ENG'], ['Urdu', 'URD'], ['Mathematics', 'MATH'],
      ['Science', 'SCI'], ['Islamiat', 'ISL'], ['Computer', 'COMP'],
    ];
    const subjectRecords = [];
    for (const [name, code] of subjectDefaults) {
      subjectRecords.push(await Subject.findOneAndUpdate(
        { schoolId: demoSchool._id, academicSessionId: session._id, name },
        { $setOnInsert: { code, createdBy: admin._id } },
        { upsert: true, new: true }
      ));
    }

    const gradeOne = classRecords.find((item) => item.name === 'Grade 1');
    const sectionA = await Section.findOne({
      schoolId: demoSchool._id, academicSessionId: session._id,
      classId: gradeOne._id, name: 'A',
    });
    const mathematics = subjectRecords.find((item) => item.name === 'Mathematics');
    await TeacherAssignment.updateOne(
      {
        schoolId: demoSchool._id, academicSessionId: session._id,
        classId: gradeOne._id, sectionId: sectionA._id,
        subjectId: mathematics._id, isActive: true, assignmentRole: 'primary',
      },
      {
        $setOnInsert: {
          teacherId: demoTeacher._id,
          assignedBy: admin._id,
        },
      },
      { upsert: true }
    );

    console.log('✅ Academic Foundation demo data is ready');

    // 7. Student Management demo data (idempotent)
    let demoStudent = await Student.findOne({
      schoolId: demoSchool._id,
      admissionNumber: 'ADM-2026-001',
    });
    if (!demoStudent) {
      demoStudent = await Student.create({
        schoolId: demoSchool._id,
        admissionNumber: 'ADM-2026-001',
        registrationNumber: 'REG-2026-001',
        fullName: 'Ali Khan',
        fatherName: 'Malik Parent',
        motherName: 'Ayesha Malik',
        gender: 'male',
        dateOfBirth: new Date('2018-05-15'),
        phone: '03219876543',
        address: 'Piplan, Mianwali',
        admissionDate: new Date('2026-04-01'),
        createdBy: admin._id,
      });
    }

    let enrollment = await StudentEnrollment.findOne({
      schoolId: demoSchool._id,
      studentId: demoStudent._id,
      academicSessionId: session._id,
      isCurrent: true,
    });
    if (!enrollment) {
      enrollment = await StudentEnrollment.create({
        schoolId: demoSchool._id,
        studentId: demoStudent._id,
        academicSessionId: session._id,
        classId: gradeOne._id,
        sectionId: sectionA._id,
        rollNumber: '1',
        createdBy: admin._id,
      });
    }
    if (!demoStudent.currentEnrollmentId ||
        !demoStudent.currentEnrollmentId.equals(enrollment._id)) {
      demoStudent.currentEnrollmentId = enrollment._id;
      await demoStudent.save();
    }

    await ParentStudent.updateOne(
      { schoolId: demoSchool._id, parentId: demoParent._id, studentId: demoStudent._id },
      {
        $set: { relationship: 'father', isPrimaryGuardian: true, isActive: true },
        $setOnInsert: { createdBy: admin._id },
      },
      { upsert: true }
    );

    await StudentCard.updateOne(
      { schoolId: demoSchool._id, studentId: demoStudent._id, status: 'active' },
      {
        $setOnInsert: {
          academicSessionId: session._id,
          cardCode: 'STU-DEMO-0001',
          issuedBy: admin._id,
        },
      },
      { upsert: true }
    );
    console.log('✅ Student Management demo data is ready');

    // 8. Add more linked Students for realistic Class screens
    const studentDefaults = [
      ['ADM-2026-002', 'REG-2026-002', 'Ahmed Hassan', 'Hassan Raza', 'male', '2018-07-11', '2'],
      ['ADM-2026-003', 'REG-2026-003', 'Fatima Noor', 'Muhammad Aslam', 'female', '2018-09-23', '3'],
      ['ADM-2026-004', 'REG-2026-004', 'Usman Ali', 'Ali Raza', 'male', '2018-02-18', '4'],
      ['ADM-2026-005', 'REG-2026-005', 'Ayesha Khan', 'Malik Parent', 'female', '2018-11-05', '5'],
    ];
    const demoStudents = [demoStudent];
    for (const [admissionNumber, registrationNumber, fullName, fatherName, gender, dateOfBirth, rollNumber] of studentDefaults) {
      let student = await Student.findOne({ schoolId: demoSchool._id, admissionNumber });
      if (!student) {
        student = await Student.create({
          schoolId: demoSchool._id,
          admissionNumber,
          registrationNumber,
          fullName,
          fatherName,
          motherName: 'Demo Mother',
          gender,
          dateOfBirth: new Date(dateOfBirth),
          phone: `0300000000${rollNumber}`,
          address: 'Piplan, Mianwali',
          admissionDate: new Date('2026-04-01'),
          createdBy: admin._id,
        });
      }
      let studentEnrollment = await StudentEnrollment.findOne({
        schoolId: demoSchool._id,
        studentId: student._id,
        isCurrent: true,
      });
      if (!studentEnrollment) {
        studentEnrollment = await StudentEnrollment.create({
          schoolId: demoSchool._id,
          studentId: student._id,
          academicSessionId: session._id,
          classId: gradeOne._id,
          sectionId: sectionA._id,
          rollNumber,
          createdBy: admin._id,
        });
      }
      if (!student.currentEnrollmentId ||
          !student.currentEnrollmentId.equals(studentEnrollment._id)) {
        student.currentEnrollmentId = studentEnrollment._id;
        await student.save();
      }
      await ParentStudent.updateOne(
        { schoolId: demoSchool._id, parentId: demoParent._id, studentId: student._id },
        {
          $set: {
            relationship: fatherName === 'Malik Parent' ? 'father' : 'guardian',
            isPrimaryGuardian: fatherName === 'Malik Parent',
            canViewAcademicData: true,
            canPayFees: true,
            isActive: true,
          },
          $setOnInsert: { createdBy: admin._id },
        },
        { upsert: true }
      );
      await StudentCard.updateOne(
        { schoolId: demoSchool._id, studentId: student._id, status: 'active' },
        {
          $setOnInsert: {
            academicSessionId: session._id,
            cardCode: `STU-DEMO-000${rollNumber}`,
            issuedBy: admin._id,
          },
        },
        { upsert: true }
      );
      demoStudents.push(student);
    }

    // Ensure the original Parent link has every viewing permission
    await ParentStudent.updateOne(
      { schoolId: demoSchool._id, parentId: demoParent._id, studentId: demoStudent._id },
      { $set: { canViewAcademicData: true, canPayFees: true, isActive: true } }
    );

    const assignment = await TeacherAssignment.findOne({
      schoolId: demoSchool._id,
      teacherId: demoTeacher._id,
      classId: gradeOne._id,
      sectionId: sectionA._id,
      subjectId: mathematics._id,
      isActive: true,
    });

    // 9. Attendance demo: submitted sheets visible to Parent
    const attendanceDays = [
      ['2026-08-24', ['present', 'present', 'absent', 'present', 'late']],
      ['2026-08-25', ['present', 'leave', 'present', 'present', 'present']],
      ['2026-08-26', ['late', 'present', 'present', 'absent', 'present']],
      ['2026-08-27', ['present', 'present', 'present', 'present', 'present']],
      ['2026-08-28', ['present', 'absent', 'present', 'leave', 'present']],
    ];
    for (const [dateValue, statuses] of attendanceDays) {
      const date = new Date(`${dateValue}T00:00:00.000Z`);
      const attendanceSession = await AttendanceSession.findOneAndUpdate(
        {
          schoolId: demoSchool._id,
          classId: gradeOne._id,
          sectionId: sectionA._id,
          date,
        },
        {
          $setOnInsert: {
            academicSessionId: session._id,
            markedBy: demoTeacher._id,
          },
          $set: { status: 'submitted', submittedAt: new Date(`${dateValue}T08:30:00.000Z`) },
        },
        { upsert: true, new: true }
      );
      for (let index = 0; index < demoStudents.length; index += 1) {
        const status = statuses[index];
        await AttendanceRecord.updateOne(
          { attendanceSessionId: attendanceSession._id, studentId: demoStudents[index]._id },
          {
            $set: {
              schoolId: demoSchool._id,
              status,
              source: index === 0 && dateValue === '2026-08-28' ? 'cardScan' : 'manual',
              scanTime: index === 0 && dateValue === '2026-08-28'
                ? new Date('2026-08-28T08:03:00.000Z')
                : undefined,
              remarks: status === 'late' ? 'Arrived after assembly' : '',
              markedBy: demoTeacher._id,
              updatedBy: demoTeacher._id,
            },
          },
          { upsert: true }
        );
      }
    }

    // 10. Teacher Homework visible to Parent
    const homeworkDefaults = [
      ['Chapter 3 Exercise', 'Complete questions 1 to 10 from Chapter 3.', '2026-08-28', '2026-08-30'],
      ['Tables Practice', 'Write and learn multiplication tables from 2 to 12.', '2026-08-27', '2026-08-29'],
      ['Math Revision', 'Revise addition and subtraction for the weekly test.', '2026-08-26', '2026-08-28'],
    ];
    for (const [title, description, assignedDate, dueDate] of homeworkDefaults) {
      await Homework.updateOne(
        { schoolId: demoSchool._id, assignmentId: assignment._id, title },
        {
          $setOnInsert: {
            academicSessionId: session._id,
            teacherId: demoTeacher._id,
            classId: gradeOne._id,
            sectionId: sectionA._id,
            subjectId: mathematics._id,
            description,
            assignedDate: new Date(assignedDate),
            dueDate: new Date(dueDate),
            status: 'published',
          },
        },
        { upsert: true }
      );
    }

    // 11. Published Examination and subject marks
    const firstTerm = await Term.findOne({
      schoolId: demoSchool._id,
      academicSessionId: session._id,
      name: 'First Term',
    });
    const examination = await Examination.findOneAndUpdate(
      {
        schoolId: demoSchool._id,
        academicSessionId: session._id,
        termId: firstTerm._id,
        name: 'First Term Examination 2026',
      },
      {
        $setOnInsert: {
          startDate: new Date('2026-07-20'),
          endDate: new Date('2026-07-31'),
          createdBy: admin._id,
        },
        $set: { status: 'published' },
      },
      { upsert: true, new: true }
    );
    const examSubject = await ExamSubject.findOneAndUpdate(
      {
        examinationId: examination._id,
        classId: gradeOne._id,
        sectionId: sectionA._id,
        subjectId: mathematics._id,
      },
      {
        $setOnInsert: {
          schoolId: demoSchool._id,
          assignedTeacherId: demoTeacher._id,
          examDate: new Date('2026-07-22'),
          maximumMarks: 100,
          passingMarks: 40,
          createdBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
    const demoMarks = [86, 72, 91, 38, 79];
    for (let index = 0; index < demoStudents.length; index += 1) {
      await ExamMark.updateOne(
        { examSubjectId: examSubject._id, studentId: demoStudents[index]._id },
        {
          $set: {
            schoolId: demoSchool._id,
            obtainedMarks: demoMarks[index],
            attendanceStatus: 'present',
            remarks: demoMarks[index] < 40 ? 'Needs improvement' : 'Good performance',
            enteredBy: demoTeacher._id,
            updatedBy: demoTeacher._id,
          },
        },
        { upsert: true }
      );
    }

    // 12. Fee Structures, invoices and receipts
    await FeeStructure.updateOne(
      {
        schoolId: demoSchool._id,
        academicSessionId: session._id,
        classId: gradeOne._id,
        title: 'Monthly Tuition Fee',
      },
      {
        $setOnInsert: {
          feeType: 'tuition',
          amount: 2500,
          frequency: 'monthly',
          createdBy: admin._id,
        },
      },
      { upsert: true }
    );
    for (let index = 0; index < demoStudents.length; index += 1) {
      const invoiceNumber = `INV-DEMO-2026-00${index + 1}`;
      const paidAmount = index === 0 ? 1500 : index === 1 ? 2500 : 0;
      const remainingAmount = 2500 - paidAmount;
      const invoice = await FeeInvoice.findOneAndUpdate(
        { invoiceNumber },
        {
          $setOnInsert: {
            invoiceNumber,
            schoolId: demoSchool._id,
            academicSessionId: session._id,
            studentId: demoStudents[index]._id,
            items: [{ title: 'August Tuition Fee', feeType: 'tuition', amount: 2500 }],
            subtotal: 2500,
            discount: 0,
            fine: 0,
            totalAmount: 2500,
            issueDate: new Date('2026-08-01'),
            dueDate: new Date('2026-08-10'),
            createdBy: admin._id,
          },
          $set: {
            paidAmount,
            remainingAmount,
            status: remainingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid',
          },
        },
        { upsert: true, new: true }
      );
      if (paidAmount > 0) {
        await FeePayment.updateOne(
          { receiptNumber: `RCP-DEMO-2026-00${index + 1}` },
          {
            $setOnInsert: {
              receiptNumber: `RCP-DEMO-2026-00${index + 1}`,
              schoolId: demoSchool._id,
              invoiceId: invoice._id,
              studentId: demoStudents[index]._id,
              amount: paidAmount,
              method: index === 0 ? 'cash' : 'bankDeposit',
              reference: index === 0 ? '' : 'BANK-DEMO-001',
              paidAt: new Date('2026-08-05'),
              recordedBy: admin._id,
            },
          },
          { upsert: true }
        );
      }
    }

    // 13. Parent Notices
    const noticeDefaults = [
      ['Parent Teacher Meeting', 'Parent Teacher Meeting will be held on Saturday at 10:00 AM.', 'important'],
      ['School Holiday', 'School will remain closed on Monday due to a local holiday.', 'urgent'],
      ['Monthly Test Schedule', 'The monthly tests will start from 5 September 2026.', 'normal'],
    ];
    for (const [title, message, priority] of noticeDefaults) {
      await Notice.updateOne(
        { schoolId: demoSchool._id, title },
        {
          $setOnInsert: {
            message,
            audience: 'parent',
            priority,
            status: 'published',
            publishedAt: new Date('2026-08-28T09:00:00.000Z'),
            expiresAt: new Date('2027-03-31T23:59:59.000Z'),
            createdBy: admin._id,
          },
        },
        { upsert: true }
      );
    }

    console.log('✅ Attendance, Homework, Exams, Fees and Notices demo data is ready');
    console.log('🔐 Logins: admin/teacher/parent @school.com — password123');

    console.log('🚀 Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
