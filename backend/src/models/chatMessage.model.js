const pool = require('../db/pool');

async function findByTeamAndDate(teamId, chatDate) {
  const { rows } = await pool.query(
    `SELECT * FROM chat_messages WHERE team_id = $1 AND chat_date = $2 ORDER BY created_at ASC`,
    [teamId, chatDate]
  );
  return rows;
}

async function create({ teamId, chatDate, senderId, messageType, content }) {
  const { rows } = await pool.query(
    `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [teamId, chatDate, senderId, messageType, content]
  );
  return rows[0];
}

module.exports = { findByTeamAndDate, create };
