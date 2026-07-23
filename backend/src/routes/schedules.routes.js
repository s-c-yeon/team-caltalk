const express = require('express');
const schedulesController = require('../controllers/schedules.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const teamMembershipMiddleware = require('../middlewares/teamMembership.middleware');
const requireRole = require('../middlewares/requireRole.middleware');

const router = express.Router({ mergeParams: true });

router.get('/', authMiddleware, teamMembershipMiddleware, schedulesController.listSchedules);
router.post(
  '/',
  authMiddleware,
  teamMembershipMiddleware,
  requireRole('leader'),
  schedulesController.createSchedule
);
router.patch(
  '/:scheduleId',
  authMiddleware,
  teamMembershipMiddleware,
  requireRole('leader'),
  schedulesController.updateSchedule
);
router.delete(
  '/:scheduleId',
  authMiddleware,
  teamMembershipMiddleware,
  requireRole('leader'),
  schedulesController.deleteSchedule
);

module.exports = router;
