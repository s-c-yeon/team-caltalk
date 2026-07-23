const pool = require('../db/pool');

async function findByTeamAndUser(teamId, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  return rows[0] || null;
}

async function findTeamsByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT teams.id, teams.name, team_members.role, teams.created_at
     FROM team_members
     JOIN teams ON teams.id = team_members.team_id
     WHERE team_members.user_id = $1
     ORDER BY teams.created_at ASC`,
    [userId]
  );
  return rows;
}

async function create(teamId, userId, role) {
  const { rows } = await pool.query(
    'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING id, team_id, user_id, role, created_at',
    [teamId, userId, role]
  );
  return rows[0];
}

async function findAllByTeam(teamId) {
  const { rows } = await pool.query(
    `SELECT users.id AS user_id, users.email, team_members.role
     FROM team_members
     JOIN users ON users.id = team_members.user_id
     WHERE team_members.team_id = $1
     ORDER BY team_members.created_at ASC`,
    [teamId]
  );
  return rows;
}

async function countLeadersByTeam(teamId) {
  const { rows } = await pool.query(
    `SELECT count(*) AS count FROM team_members WHERE team_id = $1 AND role = 'leader'`,
    [teamId]
  );
  return Number(rows[0].count);
}

async function remove(teamId, userId) {
  await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [
    teamId,
    userId,
  ]);
}

module.exports = {
  findByTeamAndUser,
  findTeamsByUserId,
  create,
  findAllByTeam,
  countLeadersByTeam,
  remove,
};
