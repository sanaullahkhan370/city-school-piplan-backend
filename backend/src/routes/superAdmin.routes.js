const express = require('express');
const {
  createSchool,
  getSchools,
  updateSchoolStatus,
  createAdmin,
} = require('../controllers/superAdmin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Tamam routes Super Admin ke liye secure hain
router.use(protect);
router.use(authorize('superAdmin'));

router.route('/schools')
  .post(createSchool)
  .get(getSchools);

router.patch('/schools/:schoolId/status', updateSchoolStatus);

router.post('/admins', createAdmin);

module.exports = router;
