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

module.exports = { createTeam, joinTeam, listMyTeams };
