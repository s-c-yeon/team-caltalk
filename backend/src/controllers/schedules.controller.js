const schedulesService = require('../services/schedules.service');

async function listSchedules(req, res, next) {
  try {
    const { teamId } = req.params;
    const { view, date } = req.query;
    const schedules = await schedulesService.getSchedules(Number(teamId), view, date);
    res.status(200).json(schedules);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSchedules };
