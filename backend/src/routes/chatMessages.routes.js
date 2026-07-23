const express = require('express');
const chatMessagesController = require('../controllers/chatMessages.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const teamMembershipMiddleware = require('../middlewares/teamMembership.middleware');

const router = express.Router({ mergeParams: true });

router.get('/', authMiddleware, teamMembershipMiddleware, chatMessagesController.listMessages);
router.post('/', authMiddleware, teamMembershipMiddleware, chatMessagesController.sendMessage);

module.exports = router;
