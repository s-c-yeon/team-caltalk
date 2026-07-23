const scheduleModel = require('../models/schedule.model');
const { validateScheduleData } = require('../validators/schedule.validator');
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

async function getScheduleById(teamId, scheduleId) {
  const schedule = await scheduleModel.findByIdAndTeam(scheduleId, teamId);
  if (!schedule) {
    throw new HttpError(404, 'SCHEDULE_NOT_FOUND', '해당 팀에 일정이 존재하지 않습니다.');
  }
  return schedule;
}

function toNullableInt(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return NaN;
  }
  return Number(value);
}

async function createSchedule(teamId, createdBy, input) {
  const data = {
    title: input.title,
    start_at: input.start_at,
    end_at: input.end_at,
    target_type: input.target_type,
    target_member_id: toNullableInt(input.target_member_id),
  };
  validateScheduleData(data);

  return scheduleModel.create({
    teamId,
    title: data.title,
    startAt: data.start_at,
    endAt: data.end_at,
    targetType: data.target_type,
    targetMemberId: data.target_member_id,
    createdBy,
  });
}

async function updateSchedule(teamId, scheduleId, input) {
  const existing = await scheduleModel.findByIdAndTeam(scheduleId, teamId);
  if (!existing) {
    throw new HttpError(404, 'SCHEDULE_NOT_FOUND', '해당 팀에 일정이 존재하지 않습니다.');
  }

  const targetType = input.target_type !== undefined ? input.target_type : existing.target_type;
  let targetMemberId;
  if (input.target_member_id !== undefined) {
    targetMemberId = toNullableInt(input.target_member_id);
  } else if (input.target_type !== undefined) {
    targetMemberId = targetType === 'all' ? null : toNullableInt(existing.target_member_id);
  } else {
    targetMemberId = toNullableInt(existing.target_member_id);
  }

  const merged = {
    title: input.title !== undefined ? input.title : existing.title,
    start_at: input.start_at !== undefined ? input.start_at : existing.start_at,
    end_at: input.end_at !== undefined ? input.end_at : existing.end_at,
    target_type: targetType,
    target_member_id: targetMemberId,
  };
  validateScheduleData(merged);

  return scheduleModel.update(scheduleId, {
    title: merged.title,
    startAt: merged.start_at,
    endAt: merged.end_at,
    targetType: merged.target_type,
    targetMemberId: merged.target_member_id,
  });
}

async function deleteSchedule(teamId, scheduleId) {
  const existing = await scheduleModel.findByIdAndTeam(scheduleId, teamId);
  if (!existing) {
    throw new HttpError(404, 'SCHEDULE_NOT_FOUND', '해당 팀에 일정이 존재하지 않습니다.');
  }
  await scheduleModel.remove(scheduleId);
}

module.exports = { getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule };
