const { HttpError } = require('../middlewares/errorHandler.middleware');

const VALID_TYPES = ['general', 'change_request'];

function validateChatMessageInput({ type, content }) {
  if (!VALID_TYPES.includes(type)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      "type은 'general' 또는 'change_request'여야 합니다."
    );
  }
  if (typeof content !== 'string' || content.length < 1 || content.length > 500) {
    throw new HttpError(400, 'VALIDATION_ERROR', '메시지 본문은 1자 이상 500자 이하여야 합니다.');
  }
}

module.exports = { validateChatMessageInput };
