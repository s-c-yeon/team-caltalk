import { groupSchedulesByDate, monthGrid } from '../../utils/date';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function MonthView({ anchorDate, schedules, selectedDate, onSelectDate, onSelectSchedule }) {
  const weeks = monthGrid(anchorDate);
  const byDate = groupSchedulesByDate(schedules);

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-neutral-200 text-xs text-neutral-500">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`p-1.5 text-center ${i === 0 ? 'text-danger-500' : i === 6 ? 'text-primary-500' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7">
          {week.map((date, dayIndex) => (
            <div
              key={dayIndex}
              onClick={() => date && onSelectDate?.(date)}
              className={`h-24 border-t border-r border-neutral-200 p-1.5 text-sm ${
                date ? 'cursor-pointer' : ''
              } ${date === selectedDate ? 'bg-primary-50 ring-1 ring-inset ring-primary-500' : ''} ${
                dayIndex === 0 ? 'text-danger-500' : dayIndex === 6 ? 'text-primary-500' : 'text-neutral-700'
              }`}
            >
              {date && <span>{Number(date.slice(8, 10))}</span>}
              <div className="mt-0.5 space-y-0.5">
                {(byDate[date] || []).map((schedule) => (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSchedule(schedule);
                    }}
                    className="block w-full truncate rounded bg-primary-50 px-1.5 py-0.5 text-left text-xs font-medium text-primary-700 hover:bg-primary-100"
                  >
                    {schedule.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
