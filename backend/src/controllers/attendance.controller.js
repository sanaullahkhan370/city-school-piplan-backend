const asyncHandler = require('express-async-handler');
const AttendanceSession = require('../models/attendanceSession.model');
const AttendanceRecord = require('../models/attendanceRecord.model');
const AttendanceCorrection = require('../models/attendanceCorrection.model');
const StudentEnrollment = require('../models/studentEnrollment.model');
const StudentCard = require('../models/studentCard.model');
const TeacherAssignment = require('../models/teacherAssignment.model');
const Section = require('../models/section.model');
const ParentStudent = require('../models/parentStudent.model');

const day = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid attendance date');
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const ensureTeacherAccess = async (req, classId, sectionId) => {
  if (req.user.role === 'admin') return;
  const [assignment, section] = await Promise.all([
    TeacherAssignment.exists({ schoolId: req.user.schoolId, teacherId: req.user._id, classId, sectionId, isActive: true }),
    Section.findOne({ _id: sectionId, schoolId: req.user.schoolId }),
  ]);
  if (!assignment && !section?.classTeacherId?.equals(req.user._id)) {
    const error = new Error('You are not assigned to this Class and Section');
    error.statusCode = 403;
    throw error;
  }
};

const studentsForSection = async (schoolId, classId, sectionId) => {
  return StudentEnrollment.find({ schoolId, classId, sectionId, isCurrent: true, status: 'active' })
    .populate({ path: 'studentId', match: { status: 'active' }, select: 'fullName admissionNumber profileImage' })
    .sort({ rollNumber: 1 });
};

const getSheet = asyncHandler(async (req, res) => {
  const { classId, sectionId } = req.query;
  if (!classId || !sectionId) { res.status(400); throw new Error('classId and sectionId are required'); }
  await ensureTeacherAccess(req, classId, sectionId);
  const date = day(req.query.date);
  const [enrollments, session] = await Promise.all([
    studentsForSection(req.user.schoolId, classId, sectionId),
    AttendanceSession.findOne({ schoolId: req.user.schoolId, classId, sectionId, date }),
  ]);
  const records = session ? await AttendanceRecord.find({ attendanceSessionId: session._id }) : [];
  const recordMap = new Map(records.map((record) => [record.studentId.toString(), record]));
  const students = enrollments.filter((item) => item.studentId).map((item) => ({
    student: item.studentId,
    enrollmentId: item._id,
    rollNumber: item.rollNumber,
    record: recordMap.get(item.studentId._id.toString()) || null,
  }));
  res.json({ success: true, data: { session, students, date } });
});

const saveManual = asyncHandler(async (req, res) => {
  const { academicSessionId, classId, sectionId, records } = req.body;
  if (!academicSessionId || !classId || !sectionId || !Array.isArray(records)) {
    res.status(400); throw new Error('Session, Class, Section and records are required');
  }
  await ensureTeacherAccess(req, classId, sectionId);
  const date = day(req.body.date);
  if (date > day()) { res.status(400); throw new Error('Future attendance is not allowed'); }
  let session = await AttendanceSession.findOne({ schoolId: req.user.schoolId, classId, sectionId, date });
  if (session?.status === 'locked') { res.status(409); throw new Error('Attendance is locked'); }
  if (!session) session = await AttendanceSession.create({
    schoolId: req.user.schoolId, academicSessionId, classId, sectionId, date, markedBy: req.user._id,
  });
  const validEnrollments = await StudentEnrollment.find({
    schoolId: req.user.schoolId, classId, sectionId, isCurrent: true,
    studentId: { $in: records.map((item) => item.studentId) },
  }).distinct('studentId');
  const valid = new Set(validEnrollments.map(String));
  const allowed = ['present', 'absent', 'leave', 'late', 'notMarked'];
  for (const item of records) {
    if (!valid.has(String(item.studentId)) || !allowed.includes(item.status)) continue;
    await AttendanceRecord.findOneAndUpdate(
      { attendanceSessionId: session._id, studentId: item.studentId },
      { $set: { schoolId: req.user.schoolId, status: item.status, source: 'manual', remarks: item.remarks || '', markedBy: req.user._id, updatedBy: req.user._id } },
      { upsert: true, new: true, runValidators: true }
    );
  }
  if (req.body.submit === true) { session.status = 'submitted'; session.submittedAt = new Date(); await session.save(); }
  res.json({ success: true, message: 'Attendance saved', data: session });
});

const scanCard = asyncHandler(async (req, res) => {
  const { cardCode, academicSessionId, classId, sectionId } = req.body;
  if (!cardCode || !academicSessionId || !classId || !sectionId) { res.status(400); throw new Error('Card and Class details are required'); }
  await ensureTeacherAccess(req, classId, sectionId);
  const card = await StudentCard.findOne({ schoolId: req.user.schoolId, cardCode: cardCode.trim().toUpperCase(), status: 'active' });
  if (!card || (card.expiresAt && card.expiresAt < new Date())) { res.status(404); throw new Error('Student Card is invalid or expired'); }
  const enrollment = await StudentEnrollment.findOne({ schoolId: req.user.schoolId, studentId: card.studentId, classId, sectionId, isCurrent: true }).populate('studentId', 'fullName admissionNumber');
  if (!enrollment) { res.status(400); throw new Error('Student does not belong to selected Class and Section'); }
  const date = day(req.body.date);
  if (date > day()) { res.status(400); throw new Error('Future attendance is not allowed'); }
  let session = await AttendanceSession.findOne({ schoolId: req.user.schoolId, classId, sectionId, date });
  if (session?.status === 'locked') { res.status(409); throw new Error('Attendance is locked'); }
  if (!session) session = await AttendanceSession.create({ schoolId: req.user.schoolId, academicSessionId, classId, sectionId, date, markedBy: req.user._id });
  const existing = await AttendanceRecord.findOne({ attendanceSessionId: session._id, studentId: card.studentId });
  if (existing) return res.json({ success: true, message: 'Attendance already marked', data: { record: existing, student: enrollment.studentId } });
  const record = await AttendanceRecord.create({ schoolId: req.user.schoolId, attendanceSessionId: session._id, studentId: card.studentId, status: 'present', source: 'cardScan', scanTime: new Date(), markedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Card attendance marked', data: { record, student: enrollment.studentId } });
});

const listSessions = asyncHandler(async (req, res) => {
  const query = { schoolId: req.user.schoolId };
  if (req.query.date) query.date = day(req.query.date);
  const data = await AttendanceSession.find(query).populate('classId', 'name').populate('sectionId', 'name').populate('markedBy', 'name').sort({ date: -1 });
  res.json({ success: true, data });
});

const adminCorrection = asyncHandler(async (req, res) => {
  if (!req.body.reason?.trim()) { res.status(400); throw new Error('Correction reason is required'); }
  const record = await AttendanceRecord.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!record) { res.status(404); throw new Error('Attendance record not found'); }
  const oldStatus = record.status;
  record.status = req.body.status;
  record.source = 'adminCorrection';
  record.updatedBy = req.user._id;
  await record.save();
  await AttendanceCorrection.create({ schoolId: req.user.schoolId, attendanceRecordId: record._id, studentId: record.studentId, oldStatus, newStatus: record.status, reason: req.body.reason, changedBy: req.user._id });
  res.json({ success: true, message: 'Attendance corrected', data: record });
});

// @desc    Get attendance of children linked with logged-in parent
// @route   GET /api/attendance/parent
// @access  Private/Parent
const getParentAttendance = asyncHandler(async (req, res) => {
  const links = await ParentStudent.find({
    schoolId: req.user.schoolId,
    parentId: req.user._id,
    isActive: true,
    canViewAcademicData: true,
  }).populate('studentId', 'fullName admissionNumber profileImage status');

  const groups = [];
  for (const link of links) {
    if (!link.studentId) continue;
    const query = {
      schoolId: req.user.schoolId,
      studentId: link.studentId._id,
    };
    const records = await AttendanceRecord.find(query)
      .populate({
        path: 'attendanceSessionId',
        match: {
          schoolId: req.user.schoolId,
          status: { $in: ['submitted', 'locked'] },
        },
        populate: [
          { path: 'classId', select: 'name' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    const visibleRecords = records.filter((record) => record.attendanceSessionId);
    const summary = {
      totalMarked: 0,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      percentage: 0,
    };
    for (const record of visibleRecords) {
      if (record.status === 'notMarked') continue;
      summary.totalMarked += 1;
      if (Object.hasOwn(summary, record.status)) summary[record.status] += 1;
    }
    summary.percentage = summary.totalMarked === 0
      ? 0
      : Number(((summary.present / summary.totalMarked) * 100).toFixed(2));

    groups.push({
      student: link.studentId,
      relationship: link.relationship,
      summary,
      records: visibleRecords,
    });
  }
  res.json({ success: true, data: groups });
});

module.exports = {
  getSheet,
  saveManual,
  scanCard,
  listSessions,
  adminCorrection,
  getParentAttendance,
};
