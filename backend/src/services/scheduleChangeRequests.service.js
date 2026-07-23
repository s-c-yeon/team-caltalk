const pool = require('../db/pool');
const chatMessageModel = require('../models/chatMessage.model');
const scheduleChangeRequestModel = require('../models/scheduleChangeRequest.model');
const { HttpError } = require('../middlewares/errorHandler.middleware');

const VALID_REQUEST_TYPES = ['create', 'update', 'cancel'];

function validateChangeRequestInput({ requestType, targetScheduleId }) {
  if (!VALID_REQUEST_TYPES.includes(requestType)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      "request_type은 'create', 'update', 'cancel' 중 하나여야 합니다."
    );
  }
  if ((requestType === 'update' || requestType === 'cancel') && !targetScheduleId) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      "request_type이 'update' 또는 'cancel'이면 target_schedule_id가 필요합니다."
    );
  }
}

async function createMessageWithChangeRequest({
  teamId,
  chatDate,
  senderId,
  content,
  requestType,
  targetScheduleId,
}) {
  validateChangeRequestInput({ requestType, targetScheduleId });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const message = await chatMessageModel.create(
      { teamId, chatDate, senderId, messageType: 'change_request', content },
      client
    );

    const changeRequest = await scheduleChangeRequestModel.create(
      {
        chatMessageId: message.id,
        requestedBy: senderId,
        requestType,
        targetScheduleId,
      },
      client
    );

    await client.query('COMMIT');
    return { message, changeRequest };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function formatChatDate(value) {
  if (value instanceof Date) {
    // pg parses DATE columns into a Date at local midnight (not UTC midnight),
    // so reading it back via local getters avoids an off-by-one-day shift
    // that toISOString() (UTC) would introduce outside the UTC timezone.
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return value;
}

function toApiListItem(row) {
  return {
    id: row.id,
    chat_message_id: row.chat_message_id,
    requested_by: row.requested_by,
    request_type: row.request_type,
    target_schedule_id: row.target_schedule_id,
    created_at: row.created_at,
    chat_message: {
      id: row.chat_message_id,
      team_id: row.message_team_id,
      chat_date: formatChatDate(row.message_chat_date),
      sender_id: row.message_sender_id,
      type: row.message_type,
      content: row.message_content,
      created_at: row.message_created_at,
    },
  };
}

async function listChangeRequests(teamId) {
  const rows = await scheduleChangeRequestModel.findAllByTeamWithMessage(teamId);
  return rows.map(toApiListItem);
}

module.exports = { createMessageWithChangeRequest, listChangeRequests };
