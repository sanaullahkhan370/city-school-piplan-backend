const express = require('express');
const { getTeacherStars, giveStar, deleteOwnStar, getParentStars } = require('../controllers/star.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();
router.use(protect);
router.get('/teacher', authorize('teacher'), getTeacherStars);
router.post('/', authorize('teacher'), giveStar);
router.delete('/:id', authorize('teacher'), deleteOwnStar);
router.get('/parent', authorize('parent'), getParentStars);

module.exports = router;
