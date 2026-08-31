const asyncHandler = require('express-async-handler');
const TeacherAssignment = require('../models/teacherAssignment.model');
const StudentEnrollment = require('../models/studentEnrollment.model');

// @desc    Get teacher dashboard data
// @route   GET /api/teacher/dashboard
// @access  Private/Teacher
const getTeacherDashboard = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Teacher dashboard data fetched successfully (Placeholder)',
    data: {
      stats: {
        assignedClasses: 0,
        totalStudents: 0,
        pendingHomeworks: 0
      }
    }
  });
});

// @desc    Get teacher profile
// @route   GET /api/teacher/profile
// @access  Private/Teacher
const getTeacherProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

const getMyAssignments = asyncHandler(async (req, res) => {
  const data = await TeacherAssignment.find({
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
    isActive: true,
  })
    .populate('academicSessionId', 'name')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name');
  res.json({ success: true, data });
});

// @desc    Get students of one class assigned to logged-in teacher
// @route   GET /api/teacher/classes/:assignmentId/students
// @access  Private/Teacher
const getMyClassStudents = asyncHandler(async (req, res) => {
  const assignment = await TeacherAssignment.findOne({
    _id: req.params.assignmentId,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
    isActive: true,
  })
    .populate('academicSessionId', 'name')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name');

  if (!assignment) {
    res.status(404);
    throw new Error('Assigned class not found');
  }

  const enrollments = await StudentEnrollment.find({
    schoolId: req.user.schoolId,
    academicSessionId: assignment.academicSessionId._id,
    classId: assignment.classId._id,
    sectionId: assignment.sectionId._id,
    isCurrent: true,
    status: 'active',
  })
    .populate({
      path: 'studentId',
      match: { status: 'active' },
      select: 'fullName admissionNumber registrationNumber profileImage gender',
    })
    .sort({ rollNumber: 1 });

  const students = enrollments
    .filter((entry) => entry.studentId)
    .map((entry) => ({
      enrollmentId: entry._id,
      rollNumber: entry.rollNumber,
      student: entry.studentId,
    }));

  res.json({
    success: true,
    data: {
      assignment,
      totalStudents: students.length,
      students,
    },
  });
});

module.exports = {
  getTeacherDashboard,
  getTeacherProfile,
  getMyAssignments,
  getMyClassStudents,
};
