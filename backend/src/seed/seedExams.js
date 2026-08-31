const Term = require('../models/term.model');
const Student = require('../models/student.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const Examination = require('../models/examination.model');
const ExamSubject = require('../models/examSubject.model');
const ExamMark = require('../models/examMark.model');
const { runSeed, getAdmin, getAcademicContext } = require('./seedUtils');

runSeed('Exams and marks seed', async () => {
  const { school, session, schoolClass, section } = await getAcademicContext();
  const admin = await getAdmin(school._id);
  const term = await Term.findOne({ schoolId: school._id, academicSessionId: session._id, name: 'First Term' });
  const assignments = await TeacherAssignment.find({
    schoolId: school._id, academicSessionId: session._id, classId: schoolClass._id,
    sectionId: section._id, isActive: true,
  }).sort({ createdAt: 1 }).limit(5);
  const students = await Student.find({ schoolId: school._id, admissionNumber: /^ADM-2026-00[1-5]$/ }).sort({ admissionNumber: 1 });
  if (!term || !assignments.length || students.length < 5) throw new Error('Run academics and students seeds first');
  const exam = await Examination.findOneAndUpdate(
    { schoolId: school._id, academicSessionId: session._id, termId: term._id, name: 'First Term Examination 2026' },
    {
      $set: { status: 'published' },
      $setOnInsert: { startDate: new Date('2026-07-20'), endDate: new Date('2026-07-31'), createdBy: admin._id },
    },
    { upsert: true, new: true }
  );
  const markSets = [[86, 72, 91, 38, 79], [75, 81, 88, 69, 93], [90, 66, 84, 77, 71], [68, 73, 95, 82, 76], [79, 87, 74, 65, 89]];
  for (let subjectIndex = 0; subjectIndex < assignments.length; subjectIndex += 1) {
    const assignment = assignments[subjectIndex];
    const paper = await ExamSubject.findOneAndUpdate(
      { examinationId: exam._id, classId: schoolClass._id, sectionId: section._id, subjectId: assignment.subjectId },
      {
        $set: { assignedTeacherId: assignment.teacherId },
        $setOnInsert: {
          schoolId: school._id, examDate: new Date(`2026-07-${22 + subjectIndex}`),
          maximumMarks: 100, passingMarks: 40, createdBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
    for (let index = 0; index < students.length; index += 1) {
      const marks = markSets[subjectIndex][index];
      await ExamMark.updateOne(
        { examSubjectId: paper._id, studentId: students[index]._id },
        {
          $set: {
            schoolId: school._id, obtainedMarks: marks, attendanceStatus: 'present',
            remarks: marks < 40 ? 'Needs improvement' : 'Good performance',
            enteredBy: assignment.teacherId, updatedBy: assignment.teacherId,
          },
        },
        { upsert: true }
      );
    }
  }
  console.log(`${assignments.length} exam papers with linked student marks are ready`);
});
