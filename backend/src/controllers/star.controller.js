const asyncHandler = require('express-async-handler');
const StudentStar = require('../models/studentStar.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const StudentEnrollment = require('../models/studentEnrollment.model');
const ParentStudent = require('../models/parentStudent.model');

const categories = ['conduct', 'cleanliness', 'punctuality', 'cooperation', 'responsibility', 'participation', 'homework'];

const populateAward = (query) => query
  .populate('studentId', 'fullName admissionNumber profileImage')
  .populate('teacherId', 'name')
  .populate('classId', 'name')
  .populate('sectionId', 'name');

const getTeacherStars = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.user.schoolId, teacherId: req.user._id };
  if (req.query.assignmentId) filter.assignmentId = req.query.assignmentId;
  const data = await populateAward(StudentStar.find(filter).sort({ awardedAt: -1, createdAt: -1 }).limit(100));
  res.json({ success: true, data });
});

const giveStar = asyncHandler(async (req, res) => {
  const { assignmentId, studentId, category, stars, comment, awardedAt } = req.body;
  const numericStars = Number(stars);
  if (!assignmentId || !studentId || !categories.includes(category) || !Number.isInteger(numericStars) || numericStars < 1 || numericStars > 5) {
    res.status(400);
    throw new Error('Assignment, student, valid category and 1 to 5 stars are required');
  }
  const assignment = await TeacherAssignment.findOne({
    _id: assignmentId,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
    isActive: true,
  });
  if (!assignment) {
    res.status(403);
    throw new Error('Active Teacher assignment not found');
  }
  const enrollment = await StudentEnrollment.findOne({
    schoolId: req.user.schoolId,
    studentId,
    academicSessionId: assignment.academicSessionId,
    classId: assignment.classId,
    sectionId: assignment.sectionId,
    isCurrent: true,
    status: 'active',
  });
  if (!enrollment) {
    res.status(400);
    throw new Error('Student is not enrolled in this assigned Class');
  }
  const item = await StudentStar.create({
    schoolId: req.user.schoolId,
    academicSessionId: assignment.academicSessionId,
    assignmentId: assignment._id,
    teacherId: req.user._id,
    studentId,
    classId: assignment.classId,
    sectionId: assignment.sectionId,
    category,
    stars: numericStars,
    comment: comment?.trim() || '',
    awardedAt: awardedAt ? new Date(awardedAt) : new Date(),
  });
  const data = await populateAward(StudentStar.findById(item._id));
  res.status(201).json({ success: true, data });
});

const deleteOwnStar = asyncHandler(async (req, res) => {
  const item = await StudentStar.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
  });
  if (!item) {
    res.status(404);
    throw new Error('Star record not found');
  }
  await item.deleteOne();
  res.json({ success: true, data: { id: req.params.id } });
});

const average = (items) => {
  if (!items.length) return 3;
  return Number((items.reduce((sum, item) => sum + item.stars, 0) / items.length).toFixed(1));
};

const getParentStars = asyncHandler(async (req, res) => {
  const links = await ParentStudent.find({
    schoolId: req.user.schoolId,
    parentId: req.user._id,
    isActive: true,
    canViewAcademicData: true,
  }).populate('studentId', 'fullName admissionNumber profileImage status');

  const data = [];
  for (const link of links) {
    if (!link.studentId || link.studentId.status !== 'active') continue;
    const awards = await populateAward(StudentStar.find({
      schoolId: req.user.schoolId,
      studentId: link.studentId._id,
    }).sort({ awardedAt: -1, createdAt: -1 }).limit(100));
    const categoryAverages = {};
    for (const category of categories) {
      categoryAverages[category] = average(awards.filter((item) => item.category === category));
    }
    data.push({
      student: link.studentId,
      summary: {
        overallAverage: average(awards),
        totalObservations: awards.length,
        specialStars: awards.filter((item) => item.stars >= 4).length,
        categoryAverages,
      },
      awards,
    });
  }
  res.json({ success: true, data });
});

module.exports = { getTeacherStars, giveStar, deleteOwnStar, getParentStars };
