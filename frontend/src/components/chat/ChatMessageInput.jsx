import { useEffect, useState } from 'react';
import * as schedulesApi from '../../api/schedules.api';

const REQUEST_TYPE_LABELS = {
  create: '신규',
  update: '수정',
  cancel: '취소',
};

export function ChatMessageInput({ teamId, date, onSend }) {
  const [type, setType] = useState(null);
  const [content, setContent] = useState('');
  const [requestType, setRequestType] = useState('');
  const [targetScheduleId, setTargetScheduleId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamId || !date || type !== 'change_request') {
      return;
    }
    const [year, month] = date.split('-');
    schedulesApi.getSchedules(teamId, 'month', `${year}-${month}-01`).then(setSchedules);
  }, [teamId, date, type]);

  function validate() {
    if (!type) {
      return '전송 유형을 선택해주세요.';
    }
    if (content.length < 1 || content.length > 500) {
      return '메시지는 1자 이상 500자 이하로 입력해주세요.';
    }
    if (type === 'change_request') {
      if (!requestType) {
        return '요청 유형을 선택해주세요.';
      }
      if ((requestType === 'update' || requestType === 'cancel') && !targetScheduleId) {
        return '대상 일정을 선택해주세요.';
      }
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = { type, content };
      if (type === 'change_request') {
        payload.request_type = requestType;
        if (requestType !== 'create') {
          payload.target_schedule_id = Number(targetScheduleId);
        }
      }
      await onSend(payload);
      setContent('');
      setType(null);
      setRequestType('');
      setTargetScheduleId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 p-3">
      {error && <p className="mb-2 text-xs text-danger-500">{error}</p>}

      <div className="mb-2 flex gap-4 text-sm">
        <label className="flex items-center gap-1.5 text-neutral-700">
          <input
            type="radio"
            name="msgType"
            checked={type === 'general'}
            onChange={() => setType('general')}
            className="accent-primary-500"
          />
          일반 메시지
        </label>
        <label className="flex items-center gap-1.5 text-neutral-700">
          <input
            type="radio"
            name="msgType"
            checked={type === 'change_request'}
            onChange={() => setType('change_request')}
            className="accent-primary-500"
          />
          변경 요청
        </label>
      </div>

      {type === 'change_request' && (
        <div className="mb-2 flex gap-2 text-sm">
          <select
            aria-label="요청 유형"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="">요청 유형 선택</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {(requestType === 'update' || requestType === 'cancel') && (
            <select
              aria-label="대상 일정"
              value={targetScheduleId}
              onChange={(e) => setTargetScheduleId(e.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            >
              <option value="">대상 일정 선택</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          aria-label="메시지"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          전송
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{content.length}/500자</p>
    </form>
  );
}
