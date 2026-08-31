const Homework = require('../models/homework.model');
const HomeworkResponse = require('../models/homeworkResponse.model');
const ParentStudent = require('../models/parentStudent.model');
const { runSeed, getAcademicContext } = require('./seedUtils');

const statuses = ['completed', 'seen', 'needsHelp', 'completed', 'seen'];
const messages = [
  'Homework checked. The child has completed it.',
  'I have seen today’s Homework.',
  'Please guide the child again on this topic.',
  'Completed and revised at home.',
  'Homework received and checked.',
];

runSeed('Parent Homework responses seed', async () => {
  const { school, session, schoolClass, section } = await getAcademicContext();
  const homeworks = await Homework.find({
    schoolId: school._id,
    academicSessionId: session._id,
    classId: schoolClass._id,
    sectionId: section._id,
    status: { $in: ['published', 'closed'] },
  }).sort({ assignedDate: -1 }).limit(3);
  const links = await ParentStudent.find({
    schoolId: school._id,
    isActive: true,
    canViewAcademicData: true,
  }).sort({ createdAt: 1 }).limit(5);
  if (!homeworks.length || !links.length) {
    throw new Error('Run accounts, students and homework seeds first');
  }
  let count = 0;
  for (let homeworkIndex = 0; homeworkIndex < homeworks.length; homeworkIndex += 1) {
    const responseLimit = homeworkIndex === 0 ? links.length : Math.max(links.length - homeworkIndex - 1, 1);
    for (let index = 0; index < responseLimit; index += 1) {
      const link = links[index];
      await HomeworkResponse.updateOne(
        {
          homeworkId: homeworks[homeworkIndex]._id,
          studentId: link.studentId,
          parentId: link.parentId,
        },
        {
          $set: {
            schoolId: school._id,
            teacherId: homeworks[homeworkIndex].teacherId,
            responseStatus: statuses[index % statuses.length],
            message: messages[index % messages.length],
            respondedAt: new Date(`2026-08-${27 + homeworkIndex}T18:00:00.000Z`),
          },
        },
        { upsert: true }
      );
      count += 1;
    }
  }
  console.log(`${count} linked Parent Homework responses are ready`);
});
