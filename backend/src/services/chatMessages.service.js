const chatMessageModel = require('../models/chatMessage.model');
const { validateChatMessageInput } = require('../validators/chatMessage.validator');
const { HttpError } = require('../middlewares/errorHandler.middleware');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function toApiMessage(row) {
  return {
    id: row.id,
    team_id: row.team_id,
    chat_date: formatChatDate(row.chat_date),
    sender_id: row.sender_id,
    type: row.message_type,
    content: row.content,
    created_at: row.created_at,
  };
}

async function getMessages(teamId, date) {
  if (!date || !DATE_PATTERN.test(date) || Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'date는 YYYY-MM-DD 형식이어야 합니다.');
  }

  const rows = await chatMessageModel.findByTeamAndDate(teamId, date);
  return rows.map(toApiMessage);
}

async function sendMessage(teamId, senderId, input) {
  validateChatMessageInput(input);

  const chatDate = new Date().toISOString().slice(0, 10);
  const row = await chatMessageModel.create({
    teamId,
    chatDate,
    senderId,
    messageType: input.type,
    content: input.content,
  });

  return {
    chat_message: toApiMessage(row),
    schedule_change_request: null,
  };
}

module.exports = { getMessages, sendMessage };
