const TeacherAssignment = require('../models/teacherAssignment.model');
const Homework = require('../models/homework.model');
const { runSeed, getAcademicContext } = require('./seedUtils');

const homework = [
  ['Chapter 3 Exercise', 'Complete questions 1 to 10 from Chapter 3.', '2026-08-28', '2026-08-30'],
  ['Tables Practice', 'Write multiplication tables from 2 to 12.', '2026-08-27', '2026-08-29'],
  ['Math Revision', 'Revise addition and subtraction for the weekly test.', '2026-08-26', '2026-08-28'],
  ['Word Problems', 'Solve the five word problems written in your notebook.', '2026-08-25', '2026-08-27'],
  ['Weekend Worksheet', 'Complete the attached classroom worksheet.', '2026-08-24', '2026-08-26'],
];

runSeed('Homework seed', async () => {
  const { school, session, schoolClass, section, subject } = await getAcademicContext();
  const assignment = await TeacherAssignment.findOne({
    schoolId: school._id, academicSessionId: session._id, classId: schoolClass._id,
    sectionId: section._id, subjectId: subject._id, isActive: true,
  });
  if (!assignment) throw new Error('Run npm run seed:academics first');
  for (const [title, description, assignedDate, dueDate] of homework) {
    await Homework.updateOne(
      { schoolId: school._id, assignmentId: assignment._id, title },
      {
        $set: { description, assignedDate: new Date(assignedDate), dueDate: new Date(dueDate), status: 'published' },
        $setOnInsert: {
          academicSessionId: session._id, teacherId: assignment.teacherId,
          classId: schoolClass._id, sectionId: section._id, subjectId: subject._id,
        },
      },
      { upsert: true }
    );
  }
  console.log('5 published homework records are ready');
});
