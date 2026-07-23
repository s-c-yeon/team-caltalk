function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ScheduleDetail({ schedule, isLeader, onEdit, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-[360px] rounded-lg border border-neutral-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">{schedule.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2 p-4 text-sm text-neutral-700">
          <p>시작: {formatDateTime(schedule.start_at)}</p>
          <p>종료: {formatDateTime(schedule.end_at)}</p>
          <p>
            대상:{' '}
            {schedule.target_type === 'all' ? '팀 전체' : `팀원 #${schedule.target_member_id}`}
          </p>
        </div>
        {isLeader && (
          <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              수정
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
