const Student = require('../models/student.model');
const AttendanceSession = require('../models/attendanceSession.model');
const AttendanceRecord = require('../models/attendanceRecord.model');
const { User, runSeed, getAcademicContext } = require('./seedUtils');

const days = [
  ['2026-08-24', ['present', 'present', 'absent', 'present', 'late']],
  ['2026-08-25', ['present', 'leave', 'present', 'present', 'present']],
  ['2026-08-26', ['late', 'present', 'present', 'absent', 'present']],
  ['2026-08-27', ['present', 'present', 'present', 'present', 'present']],
  ['2026-08-28', ['present', 'absent', 'present', 'leave', 'present']],
];

runSeed('Attendance seed', async () => {
  const { school, session, schoolClass, section } = await getAcademicContext();
  const teacher = await User.findOne({ schoolId: school._id, email: 'teacher@school.com' });
  const students = await Student.find({ schoolId: school._id, admissionNumber: /^ADM-2026-00[1-5]$/ }).sort({ admissionNumber: 1 });
  if (!teacher || students.length < 5) throw new Error('Run accounts, academics and students seeds first');
  for (const [dateText, statuses] of days) {
    const date = new Date(`${dateText}T00:00:00.000Z`);
    const sheet = await AttendanceSession.findOneAndUpdate(
      { schoolId: school._id, classId: schoolClass._id, sectionId: section._id, date },
      {
        $set: { status: 'submitted', submittedAt: new Date(`${dateText}T08:30:00.000Z`) },
        $setOnInsert: { academicSessionId: session._id, markedBy: teacher._id },
      },
      { upsert: true, new: true }
    );
    for (let index = 0; index < students.length; index += 1) {
      const cardScan = index === 0 && dateText === '2026-08-28';
      await AttendanceRecord.updateOne(
        { attendanceSessionId: sheet._id, studentId: students[index]._id },
        {
          $set: {
            schoolId: school._id, status: statuses[index], source: cardScan ? 'cardScan' : 'manual',
            scanTime: cardScan ? new Date('2026-08-28T08:03:00.000Z') : undefined,
            remarks: statuses[index] === 'late' ? 'Arrived after assembly' : '',
            markedBy: teacher._id, updatedBy: teacher._id,
          },
        },
        { upsert: true }
      );
    }
  }
  console.log('5 submitted daily sheets and 25 attendance records are ready');
});
