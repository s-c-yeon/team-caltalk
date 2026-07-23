const scheduleChangeRequestsService = require('../services/scheduleChangeRequests.service');

async function listChangeRequests(req, res, next) {
  try {
    const { teamId } = req.params;
    const items = await scheduleChangeRequestsService.listChangeRequests(Number(teamId));
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

module.exports = { listChangeRequests };
