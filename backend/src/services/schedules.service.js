const scheduleModel = require('../models/schedule.model');
const { HttpError } = require('../middlewares/errorHandler.middleware');

const VALID_VIEWS = ['month', 'week', 'day'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getRange(view, date) {
  const [year, month, day] = date.split('-').map(Number);

  if (view === 'day') {
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, day + 1));
    return [start, end];
  }

  if (view === 'week') {
    const base = new Date(Date.UTC(year, month - 1, day));
    const daysSinceMonday = (base.getUTCDay() + 6) % 7;
    const start = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7)
    );
    return [start, end];
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return [start, end];
}

async function getSchedules(teamId, view, date) {
  if (!VALID_VIEWS.includes(view)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'view는 month, week, day 중 하나여야 합니다.');
  }
  if (!date || !DATE_PATTERN.test(date) || Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'date는 YYYY-MM-DD 형식이어야 합니다.');
  }

  const [start, end] = getRange(view, date);
  return scheduleModel.findByTeamAndRange(teamId, start.toISOString(), end.toISOString());
}

module.exports = { getSchedules };
