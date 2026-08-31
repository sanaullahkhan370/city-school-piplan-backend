const express = require('express');
const controller = require('../controllers/academic.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();
router.use(protect, authorize('admin'));

router.route('/sessions').get(controller.listSessions).post(controller.createSession);
router.patch('/sessions/:id', controller.updateSession);
router.patch('/sessions/:id/current', controller.setCurrentSession);

router.route('/terms').get(controller.listTerms).post(controller.createTerm);
router.route('/classes').get(controller.listClasses).post(controller.createClass);
router.route('/sections').get(controller.listSections).post(controller.createSection);
router.route('/subjects').get(controller.listSubjects).post(controller.createSubject);
router.route('/teacher-assignments')
  .get(controller.listTeacherAssignments)
  .post(controller.createTeacherAssignment);
router.patch('/teacher-assignments/:id/deactivate', controller.deactivateTeacherAssignment);

module.exports = router;
