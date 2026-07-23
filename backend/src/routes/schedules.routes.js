const express = require('express');
const schedulesController = require('../controllers/schedules.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const teamMembershipMiddleware = require('../middlewares/teamMembership.middleware');

const router = express.Router({ mergeParams: true });

router.get('/', authMiddleware, teamMembershipMiddleware, schedulesController.listSchedules);

module.exports = router;
