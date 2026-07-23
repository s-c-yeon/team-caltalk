const pool = require('../db/pool');

async function findByTeamAndRange(teamId, startAt, endAt) {
  const { rows } = await pool.query(
    `SELECT * FROM schedules
     WHERE team_id = $1 AND start_at < $3 AND end_at > $2
     ORDER BY start_at ASC`,
    [teamId, startAt, endAt]
  );
  return rows;
}

async function findByIdAndTeam(id, teamId) {
  const { rows } = await pool.query('SELECT * FROM schedules WHERE id = $1 AND team_id = $2', [
    id,
    teamId,
  ]);
  return rows[0] || null;
}

async function create({ teamId, title, startAt, endAt, targetType, targetMemberId, createdBy }) {
  const { rows } = await pool.query(
    `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, target_member_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [teamId, title, startAt, endAt, targetType, targetMemberId, createdBy]
  );
  return rows[0];
}

async function update(id, { title, startAt, endAt, targetType, targetMemberId }) {
  const { rows } = await pool.query(
    `UPDATE schedules
     SET title = $2, start_at = $3, end_at = $4, target_type = $5, target_member_id = $6, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, title, startAt, endAt, targetType, targetMemberId]
  );
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
}

module.exports = { findByTeamAndRange, findByIdAndTeam, create, update, remove };
