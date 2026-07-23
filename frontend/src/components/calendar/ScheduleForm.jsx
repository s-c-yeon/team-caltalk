import { useState } from 'react';

function toDateTimeLocalValue(iso) {
  if (!iso) {
    return '';
  }
  return iso.slice(0, 16);
}

function toApiDateTime(localValue) {
  return `${localValue}:00Z`;
}

export function ScheduleForm({ mode, initialSchedule, members, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(initialSchedule?.title ?? '');
  const [startAt, setStartAt] = useState(toDateTimeLocalValue(initialSchedule?.start_at));
  const [endAt, setEndAt] = useState(toDateTimeLocalValue(initialSchedule?.end_at));
  const [targetType, setTargetType] = useState(initialSchedule?.target_type ?? 'all');
  const [targetMemberId, setTargetMemberId] = useState(
    initialSchedule?.target_member_id ? String(initialSchedule.target_member_id) : ''
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (title.trim().length === 0 || title.length > 100) {
      return '제목은 1~100자, 공백만으로는 입력할 수 없습니다.';
    }
    if (!startAt || !endAt) {
      return '시작/종료 일시를 입력해주세요.';
    }
    if (toApiDateTime(startAt) >= toApiDateTime(endAt)) {
      return '시작 일시는 종료 일시보다 앞서야 합니다.';
    }
    if (targetType === 'member' && !targetMemberId) {
      return '대상 팀원을 선택해주세요.';
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
      await onSave({
        title: title.trim(),
        start_at: toApiDateTime(startAt),
        end_at: toApiDateTime(endAt),
        target_type: targetType,
        target_member_id: targetType === 'member' ? Number(targetMemberId) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      return;
    }
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">
            {mode === 'create' ? '일정 생성' : '일정 수정'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <p className="text-xs text-danger-500">{error}</p>}

          <div>
            <label className="text-sm font-medium text-neutral-700" htmlFor="schedule-title">
              제목
            </label>
            <input
              id="schedule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-neutral-500">1~100자, 공백만으로는 입력 불가</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="schedule-start">
                시작 일시
              </label>
              <input
                id="schedule-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="schedule-end">
                종료 일시
              </label>
              <input
                id="schedule-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-neutral-500">시작 &lt; 종료 (같거나 역전 불가)</p>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">대상 (단일 선택)</legend>
            <label className="mt-1 flex items-center gap-1.5 text-sm text-neutral-700">
              <input
                type="radio"
                name="target-type"
                checked={targetType === 'all'}
                onChange={() => setTargetType('all')}
                className="accent-primary-500"
              />
              팀 전체
            </label>
            <label className="mt-1 flex items-center gap-1.5 text-sm text-neutral-700">
              <input
                type="radio"
                name="target-type"
                checked={targetType === 'member'}
                onChange={() => setTargetType('member')}
                className="accent-primary-500"
              />
              특정 팀원 1명
              <select
                aria-label="대상 팀원"
                value={targetMemberId}
                onChange={(e) => {
                  setTargetType('member');
                  setTargetMemberId(e.target.value);
                }}
                disabled={targetType !== 'member'}
                className="ml-1 rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
              >
                <option value="">팀원 선택</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.email}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              취소
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-md border border-danger-500 px-3 py-1.5 text-sm font-medium text-danger-500 hover:bg-danger-50"
              >
                삭제
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
