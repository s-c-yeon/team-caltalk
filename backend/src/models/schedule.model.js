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

module.exports = { findByTeamAndRange };
