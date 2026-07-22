const teamMemberModel = require('../models/teamMember.model');
const { HttpError } = require('./errorHandler.middleware');

async function teamMembershipMiddleware(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const membership = await teamMemberModel.findByTeamAndUser(teamId, req.user.id);
    if (!membership) {
      throw new HttpError(403, 'NOT_TEAM_MEMBER', '해당 팀에 소속되어 있지 않습니다.');
    }
    req.teamMembership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = teamMembershipMiddleware;
