const Student = require('../models/student.model');
const Homework = require('../models/homework.model');
const HomeworkMark = require('../models/homeworkMark.model');
const StudentStar = require('../models/studentStar.model');
const { runSeed, getAcademicContext } = require('./seedUtils');

const markSets = [
  [8, 7, 10, 6, 9],
  [9, 8, 9, 7, 10],
  [7, 6, 8, 5, 9],
  [10, 9, 8, 8, 10],
  [8, 7, 9, 6, 8],
];

runSeed('Homework marks seed', async () => {
  const { school, session, schoolClass, section } = await getAcademicContext();
  const students = await Student.find({
    schoolId: school._id,
    admissionNumber: /^ADM-2026-00[1-5]$/,
  }).sort({ admissionNumber: 1 });
  const homeworks = await Homework.find({
    schoolId: school._id,
    academicSessionId: session._id,
    classId: schoolClass._id,
    sectionId: section._id,
  }).sort({ assignedDate: 1 }).limit(5);
  if (students.length < 5 || !homeworks.length) {
    throw new Error('Run students and homework seeds first');
  }
  for (let homeworkIndex = 0; homeworkIndex < homeworks.length; homeworkIndex += 1) {
    const homework = homeworks[homeworkIndex];
    homework.maximumMarks = 10;
    await homework.save();
    for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
      await HomeworkMark.updateOne(
        { homeworkId: homework._id, studentId: students[studentIndex]._id },
        {
          $set: {
            schoolId: school._id,
            teacherId: homework.teacherId,
            obtainedMarks: markSets[homeworkIndex][studentIndex],
            remarks: markSets[homeworkIndex][studentIndex] >= 8 ? 'Good work' : 'Needs more practice',
            checkedAt: new Date('2026-08-29T10:00:00.000Z'),
          },
        },
        { upsert: true }
      );
      const obtained = markSets[homeworkIndex][studentIndex];
      const stars = obtained >= 9 ? 5 : obtained >= 7 ? 4 : 3;
      await StudentStar.updateOne(
        { homeworkId: homework._id, studentId: students[studentIndex]._id },
        {
          $set: {
            schoolId: school._id,
            academicSessionId: homework.academicSessionId,
            assignmentId: homework.assignmentId,
            teacherId: homework.teacherId,
            classId: homework.classId,
            sectionId: homework.sectionId,
            category: 'homework',
            stars,
            comment: stars === 5
              ? 'Excellent Homework. Keep it up!'
              : stars === 4
                ? 'Good Homework progress.'
                : 'Completed; continue practising.',
            awardedAt: new Date('2026-08-29T10:00:00.000Z'),
          },
        },
        { upsert: true }
      );
    }
  }
  console.log(`${homeworks.length * students.length} linked Homework marks and Stars are ready`);
});
