const express = require('express');
const teamsController = require('../controllers/teams.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, teamsController.listMyTeams);
router.post('/', authMiddleware, teamsController.createTeam);
router.post('/:teamId/members', authMiddleware, teamsController.joinTeam);

module.exports = router;
