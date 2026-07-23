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

async function listTeamMembers(teamId) {
  return teamMemberModel.findAllByTeam(teamId);
}

async function leaveTeam(teamId, userId) {
  const membership = await teamMemberModel.findByTeamAndUser(teamId, userId);
  if (!membership) {
    throw new HttpError(403, 'NOT_TEAM_MEMBER', '해당 팀에 소속되어 있지 않습니다.');
  }

  if (membership.role === 'leader') {
    const leaderCount = await teamMemberModel.countLeadersByTeam(teamId);
    if (leaderCount <= 1) {
      throw new HttpError(
        400,
        'SOLE_LEADER_CANNOT_LEAVE',
        '탈퇴할 수 없습니다. 이 팀에는 다른 팀장이 없습니다.'
      );
    }
  }

  await teamMemberModel.remove(teamId, userId);
}

module.exports = { createTeam, joinTeam, listMyTeams, listTeamMembers, leaveTeam };
