const asyncHandler = require('express-async-handler');
const Notice = require('../models/notice.model');

const listAdminNotices = asyncHandler(async (req, res) => {
  const data = await Notice.find({ schoolId: req.user.schoolId })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});

const createNotice = asyncHandler(async (req, res) => {
  const { title, message, audience, priority, status, expiresAt } = req.body;
  if (!title?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error('Notice title and message are required');
  }
  const publish = status === 'published';
  const data = await Notice.create({
    schoolId: req.user.schoolId,
    title: title.trim(),
    message: message.trim(),
    audience: ['all', 'parent', 'teacher', 'admin'].includes(audience)
      ? audience
      : 'all',
    priority: ['normal', 'important', 'urgent'].includes(priority)
      ? priority
      : 'normal',
    status: publish ? 'published' : 'draft',
    publishedAt: publish ? new Date() : undefined,
    expiresAt: expiresAt || undefined,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, message: 'Notice created', data });
});

const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });
  if (!notice) {
    res.status(404);
    throw new Error('Notice not found');
  }
  const wasPublished = notice.status === 'published';
  const allowed = ['title', 'message', 'audience', 'priority', 'status', 'expiresAt'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) notice[field] = req.body[field] || undefined;
  }
  if (!notice.title?.trim() || !notice.message?.trim()) {
    res.status(400);
    throw new Error('Notice title and message are required');
  }
  if (!wasPublished && notice.status === 'published') notice.publishedAt = new Date();
  if (notice.status === 'draft') notice.publishedAt = undefined;
  notice.updatedBy = req.user._id;
  await notice.save();
  res.json({ success: true, message: 'Notice updated', data: notice });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });
  if (!notice) {
    res.status(404);
    throw new Error('Notice not found');
  }
  await notice.deleteOne();
  res.json({ success: true, message: 'Notice deleted', data: { id: req.params.id } });
});

const listParentNotices = asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await Notice.find({
    schoolId: req.user.schoolId,
    status: 'published',
    audience: { $in: ['all', 'parent'] },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: now } },
    ],
  })
    .populate('createdBy', 'name')
    .sort({ publishedAt: -1, createdAt: -1 });
  res.json({ success: true, data });
});

module.exports = {
  listAdminNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  listParentNotices,
};
