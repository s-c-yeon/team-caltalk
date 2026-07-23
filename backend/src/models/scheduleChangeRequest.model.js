const pool = require('../db/pool');

async function create(
  { chatMessageId, requestedBy, requestType, targetScheduleId },
  client = pool
) {
  const { rows } = await client.query(
    `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type, target_schedule_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [chatMessageId, requestedBy, requestType, targetScheduleId || null]
  );
  return rows[0];
}

async function findAllByTeamWithMessage(teamId) {
  const { rows } = await pool.query(
    `SELECT
       scr.id,
       scr.chat_message_id,
       scr.requested_by,
       scr.request_type,
       scr.target_schedule_id,
       scr.created_at,
       cm.team_id AS message_team_id,
       cm.chat_date AS message_chat_date,
       cm.sender_id AS message_sender_id,
       cm.message_type AS message_type,
       cm.content AS message_content,
       cm.created_at AS message_created_at
     FROM schedule_change_requests scr
     JOIN chat_messages cm ON cm.id = scr.chat_message_id
     WHERE cm.team_id = $1
     ORDER BY scr.created_at ASC`,
    [teamId]
  );
  return rows;
}

module.exports = { create, findAllByTeamWithMessage };
