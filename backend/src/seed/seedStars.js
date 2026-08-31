const Student = require('../models/student.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const StudentStar = require('../models/studentStar.model');
const { runSeed, getAcademicContext } = require('./seedUtils');

const demoAwards = [
  [0, 'cooperation', 5, 'Helped another Student during class activity.'],
  [0, 'responsibility', 4, 'Completed the assigned classroom responsibility.'],
  [1, 'conduct', 4, 'Showed respectful behaviour throughout the lesson.'],
  [1, 'cleanliness', 5, 'Uniform and personal cleanliness were excellent.'],
  [1, 'punctuality', 4, 'Arrived on time and was ready before the lesson started.'],
  [2, 'participation', 5, 'Participated confidently and answered questions.'],
  [2, 'cooperation', 4, 'Worked very well with the group.'],
  [3, 'conduct', 2, 'Needs to avoid disturbing the class.'],
  [3, 'responsibility', 4, 'Looked after classroom materials responsibly.'],
  [4, 'cleanliness', 5, 'Kept desk, books and uniform very clean.'],
  [4, 'participation', 4, 'Actively participated in the Mathematics activity.'],
];

runSeed('Student Stars and Development seed', async () => {
  const { school, session, schoolClass, section, subject } = await getAcademicContext();
  const assignment = await TeacherAssignment.findOne({
    schoolId: school._id,
    academicSessionId: session._id,
    classId: schoolClass._id,
    sectionId: section._id,
    subjectId: subject._id,
    isActive: true,
  });
  const students = await Student.find({
    schoolId: school._id,
    admissionNumber: /^ADM-2026-00[1-5]$/,
  }).sort({ admissionNumber: 1 });
  if (!assignment || students.length < 5) {
    throw new Error('Run academics and students seeds first');
  }
  for (let index = 0; index < demoAwards.length; index += 1) {
    const [studentIndex, category, stars, comment] = demoAwards[index];
    await StudentStar.updateOne(
      {
        schoolId: school._id,
        studentId: students[studentIndex]._id,
        category,
        comment,
      },
      {
        $setOnInsert: {
          academicSessionId: session._id,
          assignmentId: assignment._id,
          teacherId: assignment.teacherId,
          classId: schoolClass._id,
          sectionId: section._id,
          stars,
          awardedAt: new Date(`2026-08-${19 + index}T09:00:00.000Z`),
        },
      },
      { upsert: true }
    );
  }
  console.log('11 linked Teacher Star observations are ready');
});
