const crypto = require('crypto');
const teamModel = require('../models/team.model');
const teamMemberModel = require('../models/teamMember.model');
const { HttpError } = require('../middlewares/errorHandler.middleware');

function generateInviteCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function createTeam(name, userId) {
  if (!name || name.trim().length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', '팀 이름을 입력해주세요.');
  }

  const team = await teamModel.create(name, generateInviteCode());
  await teamMemberModel.create(team.id, userId, 'leader');
  return team;
}

async function joinTeam(teamId, inviteCode, userId) {
  if (!inviteCode) {
    throw new HttpError(400, 'VALIDATION_ERROR', '초대 코드를 입력해주세요.');
  }

  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new HttpError(404, 'TEAM_NOT_FOUND', '팀을 찾을 수 없습니다.');
  }
  if (team.invite_code !== inviteCode) {
    throw new HttpError(400, 'INVALID_INVITE_CODE', '초대 코드가 일치하지 않습니다.');
  }

  const existing = await teamMemberModel.findByTeamAndUser(teamId, userId);
  if (existing) {
    throw new HttpError(409, 'ALREADY_MEMBER', '이미 소속된 팀입니다.');
  }

  return teamMemberModel.create(teamId, userId, 'member');
}

async function listMyTeams(userId) {
  return teamMemberModel.findTeamsByUserId(userId);
}

module.exports = { createTeam, joinTeam, listMyTeams };
