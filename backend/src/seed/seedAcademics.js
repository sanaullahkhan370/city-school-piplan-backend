const AcademicSession = require('../models/academicSession.model');
const Term = require('../models/term.model');
const SchoolClass = require('../models/class.model');
const Section = require('../models/section.model');
const Subject = require('../models/subject.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const { User, runSeed, getSchool, getAdmin } = require('./seedUtils');

runSeed('Academic setup and teacher assignments seed', async () => {
  const school = await getSchool();
  const admin = await getAdmin(school._id);
  let session = await AcademicSession.findOne({ schoolId: school._id, name: '2026-2027' });
  if (!session) {
    session = await AcademicSession.create({
      schoolId: school._id, name: '2026-2027',
      startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31'),
      isCurrent: true, status: 'active', createdBy: admin._id,
    });
  }
  await AcademicSession.updateMany(
    { schoolId: school._id, _id: { $ne: session._id }, isCurrent: true },
    { $set: { isCurrent: false } }
  );
  await AcademicSession.updateOne({ _id: session._id }, { $set: { isCurrent: true, status: 'active' } });

  for (const [name, startDate, endDate] of [
    ['First Term', '2026-04-01', '2026-07-31'],
    ['Second Term', '2026-08-01', '2026-11-30'],
    ['Final Term', '2026-12-01', '2027-03-31'],
  ]) {
    await Term.updateOne(
      { schoolId: school._id, academicSessionId: session._id, name },
      { $setOnInsert: { startDate: new Date(startDate), endDate: new Date(endDate), status: 'active', createdBy: admin._id } },
      { upsert: true }
    );
  }

  const classNames = ['Nursery', 'Prep', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
  const classes = [];
  for (let index = 0; index < classNames.length; index += 1) {
    const schoolClass = await SchoolClass.findOneAndUpdate(
      { schoolId: school._id, academicSessionId: session._id, name: classNames[index] },
      { $setOnInsert: { displayOrder: index, createdBy: admin._id } },
      { upsert: true, new: true }
    );
    classes.push(schoolClass);
    for (const name of ['A', 'B']) {
      await Section.updateOne(
        { schoolId: school._id, academicSessionId: session._id, classId: schoolClass._id, name },
        { $setOnInsert: { createdBy: admin._id } }, { upsert: true }
      );
    }
  }

  const subjects = [];
  for (const [name, code] of [
    ['English', 'ENG'], ['Urdu', 'URD'], ['Mathematics', 'MATH'],
    ['Science', 'SCI'], ['Islamiat', 'ISL'], ['Computer', 'COMP'],
  ]) {
    subjects.push(await Subject.findOneAndUpdate(
      { schoolId: school._id, academicSessionId: session._id, name },
      { $setOnInsert: { code, createdBy: admin._id } }, { upsert: true, new: true }
    ));
  }

  const gradeOne = classes.find((item) => item.name === 'Grade 1');
  const sectionA = await Section.findOne({ classId: gradeOne._id, name: 'A' });
  const teachers = await User.find({ schoolId: school._id, role: 'teacher', isActive: true }).sort({ email: 1 });
  if (teachers.length < 5) throw new Error('Run npm run seed:accounts first (five teachers required)');
  for (let index = 0; index < 5; index += 1) {
    await TeacherAssignment.updateOne(
      {
        schoolId: school._id, academicSessionId: session._id, classId: gradeOne._id,
        sectionId: sectionA._id, subjectId: subjects[index]._id, assignmentRole: 'primary',
      },
      { $set: { teacherId: teachers[index]._id, assignedBy: admin._id, isActive: true } },
      { upsert: true }
    );
  }
  console.log('7 classes, 14 sections, 6 subjects and 5 teacher assignments are ready');
});
