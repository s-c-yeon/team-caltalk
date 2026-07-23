const express = require('express');
const scheduleChangeRequestsController = require('../controllers/scheduleChangeRequests.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const teamMembershipMiddleware = require('../middlewares/teamMembership.middleware');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  authMiddleware,
  teamMembershipMiddleware,
  scheduleChangeRequestsController.listChangeRequests
);

module.exports = router;
