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

module.exports = { createMessageWithChangeRequest };
