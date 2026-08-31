const express = require('express');
const {
  getParentDashboard,
  getParentProfile,
  getMyChildren,
} = require('../controllers/parent.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Tamam routes Parent ke liye secure hain
router.use(protect);
router.use(authorize('parent'));

router.get('/dashboard', getParentDashboard);
router.get('/profile', getParentProfile);
router.get('/children', getMyChildren);

module.exports = router;
