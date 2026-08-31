const asyncHandler = require('express-async-handler');
const ParentStudent = require('../models/parentStudent.model');
const StudentEnrollment = require('../models/studentEnrollment.model');
const StudentStar = require('../models/studentStar.model');
const HomeworkMark = require('../models/homeworkMark.model');

const developmentCategories = ['conduct', 'cleanliness', 'punctuality', 'responsibility', 'homework'];

const starAverage = (records) => {
  if (!records.length) return 3;
  return Number((records.reduce((sum, item) => sum + item.stars, 0) / records.length).toFixed(1));
};

// @desc    Get parent dashboard data
// @route   GET /api/parent/dashboard
// @access  Private/Parent
const getParentDashboard = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Parent dashboard data fetched successfully (Placeholder)',
    data: {
      stats: {
        linkedChildren: 0,
        unpaidFees: 0,
        recentNotices: 0
      }
    }
  });
});

// @desc    Get parent profile
// @route   GET /api/parent/profile
// @access  Private/Parent
const getParentProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// @desc    Get students linked with logged-in parent
// @route   GET /api/parent/children
// @access  Private/Parent
const getMyChildren = asyncHandler(async (req, res) => {
  const links = await ParentStudent.find({
    schoolId: req.user.schoolId,
    parentId: req.user._id,
    isActive: true,
  }).populate(
    'studentId',
    'fullName fatherName motherName gender dateOfBirth admissionNumber registrationNumber phone address profileImage admissionDate status'
  );

  const children = [];
  for (const link of links) {
    if (!link.studentId) continue;
    const enrollment = await StudentEnrollment.findOne({
      schoolId: req.user.schoolId,
      studentId: link.studentId._id,
      isCurrent: true,
      status: 'active',
    })
      .populate('academicSessionId', 'name')
      .populate('classId', 'name')
      .populate('sectionId', 'name');

    const starRecords = link.canViewAcademicData
      ? await StudentStar.find({
          schoolId: req.user.schoolId,
          studentId: link.studentId._id,
        })
          .populate('teacherId', 'name')
          .sort({ awardedAt: -1, createdAt: -1 })
          .limit(100)
      : [];
    const categoryAverages = {};
    for (const category of developmentCategories) {
      categoryAverages[category] = starAverage(
        starRecords.filter((record) => record.category === category)
      );
    }
    const homeworkMarks = link.canViewAcademicData
      ? await HomeworkMark.find({
          schoolId: req.user.schoolId,
          studentId: link.studentId._id,
        })
          .populate({
            path: 'homeworkId',
            select: 'title maximumMarks assignedDate dueDate subjectId',
            populate: { path: 'subjectId', select: 'name' },
          })
          .populate('teacherId', 'name')
          .sort({ checkedAt: -1 })
          .limit(100)
      : [];
    const validHomeworkMarks = homeworkMarks.filter((mark) => mark.homeworkId);
    const homeworkObtainedTotal = validHomeworkMarks.reduce(
      (sum, mark) => sum + Number(mark.obtainedMarks || 0),
      0
    );
    const homeworkMaximumTotal = validHomeworkMarks.reduce(
      (sum, mark) => sum + Number(mark.homeworkId.maximumMarks || 10),
      0
    );

    children.push({
      linkId: link._id,
      relationship: link.relationship,
      isPrimaryGuardian: link.isPrimaryGuardian,
      canViewAcademicData: link.canViewAcademicData,
      canPayFees: link.canPayFees,
      student: link.studentId,
      currentEnrollment: enrollment,
      development: {
        overallAverage: starAverage(starRecords),
        totalObservations: starRecords.length,
        categoryAverages,
        recentAwards: starRecords.slice(0, 10),
      },
      homeworkPerformance: {
        checkedCount: validHomeworkMarks.length,
        obtainedTotal: homeworkObtainedTotal,
        maximumTotal: homeworkMaximumTotal,
        percentage: homeworkMaximumTotal === 0
          ? 0
          : Number(((homeworkObtainedTotal / homeworkMaximumTotal) * 100).toFixed(1)),
        recentMarks: validHomeworkMarks.slice(0, 10),
      },
    });
  }

  res.json({ success: true, data: children });
});

module.exports = {
  getParentDashboard,
  getParentProfile,
  getMyChildren,
};
