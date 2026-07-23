function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function DayView({ anchorDate, schedules, onSelectSchedule }) {
  const daySchedules = [...schedules].sort((a, b) => a.start_at.localeCompare(b.start_at));

  return (
    <div className="flex-1 overflow-auto p-3">
      <p className="mb-2 text-sm font-medium text-neutral-700">{anchorDate}</p>
      {daySchedules.length === 0 && <p className="text-sm text-neutral-500">일정이 없습니다.</p>}
      <ul className="space-y-1">
        {daySchedules.map((schedule) => (
          <li key={schedule.id}>
            <button
              type="button"
              onClick={() => onSelectSchedule(schedule)}
              className="flex w-full items-center gap-2 rounded bg-primary-50 px-2 py-1.5 text-left text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              <span className="text-xs text-neutral-500">{formatTime(schedule.start_at)}</span>
              {schedule.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
