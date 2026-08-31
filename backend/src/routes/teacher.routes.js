const express = require('express');
const {
  getTeacherDashboard,
  getTeacherProfile,
  getMyAssignments,
  getMyClassStudents,
} = require('../controllers/teacher.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Tamam routes Teacher ke liye secure hain
router.use(protect);
router.use(authorize('teacher'));

router.get('/dashboard', getTeacherDashboard);
router.get('/profile', getTeacherProfile);
router.get('/assignments', getMyAssignments);
router.get('/classes/:assignmentId/students', getMyClassStudents);

module.exports = router;
