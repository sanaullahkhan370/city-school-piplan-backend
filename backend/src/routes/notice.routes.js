const express = require('express');
const controller = require('../controllers/notice.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();
router.use(protect);
router.get('/parent', authorize('parent'), controller.listParentNotices);
router.get('/admin', authorize('admin'), controller.listAdminNotices);
router.post('/', authorize('admin'), controller.createNotice);
router.patch('/:id', authorize('admin'), controller.updateNotice);
router.delete('/:id', authorize('admin'), controller.deleteNotice);

module.exports = router;
