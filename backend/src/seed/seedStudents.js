const Student = require('../models/student.model');
const StudentEnrollment = require('../models/studentEnrollment.model');
const ParentStudent = require('../models/parentStudent.model');
const StudentCard = require('../models/studentCard.model');
const { User, runSeed, getAdmin, getAcademicContext } = require('./seedUtils');

const students = [
  ['ADM-2026-001', 'REG-2026-001', 'Ali Khan', 'Malik Parent', 'male', '2018-05-15'],
  ['ADM-2026-002', 'REG-2026-002', 'Ahmed Hassan', 'Hassan Parent', 'male', '2018-07-11'],
  ['ADM-2026-003', 'REG-2026-003', 'Fatima Noor', 'Aslam Parent', 'female', '2018-09-23'],
  ['ADM-2026-004', 'REG-2026-004', 'Usman Raza', 'Raza Parent', 'male', '2018-02-18'],
  ['ADM-2026-005', 'REG-2026-005', 'Ayesha Khan', 'Khan Parent', 'female', '2018-11-05'],
];

runSeed('Students, children links and cards seed', async () => {
  const { school, session, schoolClass, section } = await getAcademicContext();
  const admin = await getAdmin(school._id);
  const parentEmails = ['parent@school.com', 'parent2@school.com', 'parent3@school.com', 'parent4@school.com', 'parent5@school.com'];
  const parentRecords = await User.find({ schoolId: school._id, role: 'parent', email: { $in: parentEmails } });
  const parents = parentEmails.map((email) => parentRecords.find((item) => item.email === email)).filter(Boolean);
  if (parents.length < 5) throw new Error('Run npm run seed:accounts first (five parents required)');

  for (let index = 0; index < students.length; index += 1) {
    const [admissionNumber, registrationNumber, fullName, fatherName, gender, dob] = students[index];
    const student = await Student.findOneAndUpdate(
      { schoolId: school._id, admissionNumber },
      {
        $set: { registrationNumber, fullName, fatherName, gender, status: 'active' },
        $setOnInsert: {
          motherName: 'Demo Mother', dateOfBirth: new Date(dob), phone: `0333000000${index + 1}`,
          address: 'Piplan, Mianwali', admissionDate: new Date('2026-04-01'), createdBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
    const enrollment = await StudentEnrollment.findOneAndUpdate(
      { schoolId: school._id, studentId: student._id, academicSessionId: session._id, isCurrent: true },
      {
        $set: { classId: schoolClass._id, sectionId: section._id, rollNumber: String(index + 1) },
        $setOnInsert: { createdBy: admin._id },
      },
      { upsert: true, new: true }
    );
    await Student.updateOne({ _id: student._id }, { $set: { currentEnrollmentId: enrollment._id } });
    await ParentStudent.updateOne(
      { schoolId: school._id, parentId: parents[index]._id, studentId: student._id },
      {
        $set: { relationship: 'father', isPrimaryGuardian: true, canViewAcademicData: true, canPayFees: true, isActive: true },
        $setOnInsert: { createdBy: admin._id },
      },
      { upsert: true }
    );
    await StudentCard.updateOne(
      { schoolId: school._id, studentId: student._id, status: 'active' },
      { $setOnInsert: { academicSessionId: session._id, cardCode: `STU-DEMO-000${index + 1}`, issuedBy: admin._id } },
      { upsert: true }
    );
  }
  console.log('5 linked children with enrollments, parents and cards are ready');
});
