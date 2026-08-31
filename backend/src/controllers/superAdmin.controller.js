const asyncHandler = require('express-async-handler');
const School = require('../models/school.model');
const User = require('../models/user.model');

// @desc    Create a new school
// @route   POST /api/super-admin/schools
// @access  Private/SuperAdmin
const createSchool = asyncHandler(async (req, res) => {
  const { name, address, phone, email } = req.body;

  const schoolExists = await School.findOne({ email });

  if (schoolExists) {
    res.status(400);
    throw new Error('School with this email already exists');
  }

  const school = await School.create({
    name,
    address,
    phone,
    email,
  });

  res.status(201).json({
    success: true,
    message: 'School created successfully',
    data: school,
  });
});

// @desc    Get all schools
// @route   GET /api/super-admin/schools
// @access  Private/SuperAdmin
const getSchools = asyncHandler(async (req, res) => {
  const schools = await School.find({});
  res.json({
    success: true,
    data: schools,
  });
});

// @desc    Update school status
// @route   PATCH /api/super-admin/schools/:schoolId/status
// @access  Private/SuperAdmin
const updateSchoolStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const school = await School.findById(req.params.schoolId);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  school.status = status;
  await school.save();

  res.json({
    success: true,
    message: `School status updated to ${status}`,
    data: school,
  });
});

// @desc    Create a school admin
// @route   POST /api/super-admin/admins
// @access  Private/SuperAdmin
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, schoolId } = req.body;

  // Check if school exists
  const school = await School.findById(schoolId);
  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email or phone already exists');
  }

  const admin = await User.create({
    name,
    email,
    phone,
    password,
    role: 'admin',
    schoolId,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'School Admin created successfully',
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      schoolId: admin.schoolId,
    },
  });
});

module.exports = {
  createSchool,
  getSchools,
  updateSchoolStatus,
  createAdmin,
};
