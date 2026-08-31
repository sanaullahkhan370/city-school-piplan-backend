const asyncHandler = require('express-async-handler');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const SchoolClass = require('../models/class.model');

// @desc    Create a teacher
// @route   POST /api/admin/teachers
// @access  Private/Admin
const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email or phone already exists');
  }

  const teacher = await User.create({
    name,
    email,
    phone,
    password,
    role: 'teacher',
    schoolId: req.user.schoolId, // Admin's school ID automatically assigned
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully',
    data: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      schoolId: teacher.schoolId,
    },
  });
});

// @desc    Create a parent
// @route   POST /api/admin/parents
// @access  Private/Admin
const createParent = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email or phone already exists');
  }

  const parent = await User.create({
    name,
    email,
    phone,
    password,
    role: 'parent',
    schoolId: req.user.schoolId, // Admin's school ID automatically assigned
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Parent created successfully',
    data: {
      _id: parent._id,
      name: parent.name,
      email: parent.email,
      role: parent.role,
      schoolId: parent.schoolId,
    },
  });
});

// @desc    Get all users of the school
// @route   GET /api/admin/users
// @access  Private/Admin
const getSchoolUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ schoolId: req.user.schoolId });
  res.json({
    success: true,
    data: users,
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const [students, teachers, classes] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active' }),
    User.countDocuments({ schoolId, role: 'teacher', isActive: true }),
    SchoolClass.countDocuments({ schoolId }),
  ]);
  res.json({ success: true, data: { students, teachers, classes } });
});

module.exports = {
  createTeacher,
  createParent,
  getSchoolUsers,
  getDashboardStats,
};
