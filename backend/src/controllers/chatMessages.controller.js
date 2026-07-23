const chatMessagesService = require('../services/chatMessages.service');

async function listMessages(req, res, next) {
  try {
    const { teamId } = req.params;
    const { date } = req.query;
    const messages = await chatMessagesService.getMessages(Number(teamId), date);
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { teamId } = req.params;
    const result = await chatMessagesService.sendMessage(Number(teamId), req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMessages, sendMessage };
