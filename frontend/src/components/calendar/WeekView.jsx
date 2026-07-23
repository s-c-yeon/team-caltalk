import { groupSchedulesByDate, weekDates } from '../../utils/date';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function WeekView({ anchorDate, schedules, selectedDate, onSelectDate, onSelectSchedule }) {
  const dates = weekDates(anchorDate);
  const byDate = groupSchedulesByDate(schedules);

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const weekday = new Date(date).getDay();
          return (
            <div
              key={date}
              onClick={() => onSelectDate?.(date)}
              className={`min-h-40 cursor-pointer border-t border-r border-neutral-200 p-1.5 text-sm ${
                date === selectedDate ? 'bg-primary-50 ring-1 ring-inset ring-primary-500' : ''
              } ${weekday === 0 ? 'text-danger-500' : weekday === 6 ? 'text-primary-500' : 'text-neutral-700'}`}
            >
              <div className="text-xs text-neutral-500">
                {WEEKDAY_LABELS[weekday]} {Number(date.slice(8, 10))}
              </div>
              <div className="mt-1 space-y-0.5">
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
          );
        })}
      </div>
    </div>
  );
}
