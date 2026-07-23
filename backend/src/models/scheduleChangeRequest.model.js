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

module.exports = { create };
