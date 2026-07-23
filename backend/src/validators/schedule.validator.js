const { HttpError } = require('../middlewares/errorHandler.middleware');

function validateScheduleData({ title, start_at: startAt, end_at: endAt, target_type: targetType, target_member_id: targetMemberId }) {
  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      '제목은 1자 이상 100자 이하이며 공백만으로 구성될 수 없습니다.'
    );
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new HttpError(400, 'VALIDATION_ERROR', '시작 일시는 종료 일시보다 앞서야 합니다.');
  }

  if (targetType !== 'all' && targetType !== 'member') {
    throw new HttpError(400, 'VALIDATION_ERROR', "대상은 'all' 또는 'member' 중 하나여야 합니다.");
  }

  if (targetType === 'all' && targetMemberId != null) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      "대상이 'all'이면 target_member_id를 지정할 수 없습니다."
    );
  }

  if (targetType === 'member' && !Number.isInteger(targetMemberId)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      "대상이 'member'이면 target_member_id가 필요합니다."
    );
  }
}

module.exports = { validateScheduleData };
