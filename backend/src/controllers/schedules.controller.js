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

async function createSchedule(req, res, next) {
  try {
    const { teamId } = req.params;
    const schedule = await schedulesService.createSchedule(Number(teamId), req.user.id, req.body);
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const { teamId, scheduleId } = req.params;
    const schedule = await schedulesService.updateSchedule(
      Number(teamId),
      Number(scheduleId),
      req.body
    );
    res.status(200).json(schedule);
  } catch (err) {
    next(err);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const { teamId, scheduleId } = req.params;
    await schedulesService.deleteSchedule(Number(teamId), Number(scheduleId));
    res.status(200).json({ message: '일정이 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSchedules, createSchedule, updateSchedule, deleteSchedule };
