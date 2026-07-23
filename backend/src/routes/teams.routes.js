const express = require('express');
const teamsController = require('../controllers/teams.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const teamMembershipMiddleware = require('../middlewares/teamMembership.middleware');

const router = express.Router();

router.get('/', authMiddleware, teamsController.listMyTeams);
router.post('/', authMiddleware, teamsController.createTeam);
router.get(
  '/:teamId/members',
  authMiddleware,
  teamMembershipMiddleware,
  teamsController.listTeamMembers
);
router.post('/:teamId/members', authMiddleware, teamsController.joinTeam);
router.delete(
  '/:teamId/members/me',
  authMiddleware,
  teamMembershipMiddleware,
  teamsController.leaveTeam
);

module.exports = router;
