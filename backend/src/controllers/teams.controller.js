const teamsService = require('../services/teams.service');

async function createTeam(req, res, next) {
  try {
    const { name } = req.body;
    const team = await teamsService.createTeam(name, req.user.id);
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
}

async function joinTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    const { invite_code: inviteCode } = req.body;
    const membership = await teamsService.joinTeam(Number(teamId), inviteCode, req.user.id);
    res.status(201).json(membership);
  } catch (err) {
    next(err);
  }
}

async function listMyTeams(req, res, next) {
  try {
    const teams = await teamsService.listMyTeams(req.user.id);
    res.status(200).json(teams);
  } catch (err) {
    next(err);
  }
}

async function listTeamMembers(req, res, next) {
  try {
    const { teamId } = req.params;
    const members = await teamsService.listTeamMembers(Number(teamId));
    res.status(200).json(members);
  } catch (err) {
    next(err);
  }
}

async function leaveTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    await teamsService.leaveTeam(Number(teamId), req.user.id);
    res.status(200).json({ message: '팀에서 탈퇴했습니다.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTeam, joinTeam, listMyTeams, listTeamMembers, leaveTeam };
