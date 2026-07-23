import { useState } from 'react';
import { useSchedules } from '../../hooks/useSchedules';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { shiftDate, todayDateString } from '../../utils/date';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ScheduleDetail } from './ScheduleDetail';
import { ScheduleForm } from './ScheduleForm';

const VIEWS = [
  { key: 'month', label: '월' },
  { key: 'week', label: '주' },
  { key: 'day', label: '일' },
];

const VIEW_COMPONENTS = {
  month: MonthView,
  week: WeekView,
  day: DayView,
};

export function CalendarView({ teamId, isLeader, selectedDate, onSelectDate }) {
  const [view, setView] = useState('month');
  const [anchorDate, setAnchorDate] = useState(() => selectedDate || todayDateString());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formState, setFormState] = useState(null);

  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule } =
    useSchedules(teamId, view, anchorDate);
  const { members } = useTeamMembers(teamId);
  const ViewComponent = VIEW_COMPONENTS[view];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 p-3">
        <div className="inline-flex overflow-hidden rounded-md border border-neutral-200">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`border-l border-neutral-200 px-3 py-1.5 text-sm font-medium first:border-l-0 ${
                view === key ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            aria-label="이전"
            onClick={() => setAnchorDate((d) => shiftDate(d, view, -1))}
          >
            ◀
          </button>
          <span className="font-medium text-neutral-900">{anchorDate}</span>
          <button
            type="button"
            aria-label="다음"
            onClick={() => setAnchorDate((d) => shiftDate(d, view, 1))}
          >
            ▶
          </button>
        </div>
        {isLeader && (
          <button
            type="button"
            onClick={() => setFormState({ mode: 'create' })}
            className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            + 일정 추가
          </button>
        )}
      </div>

      {loading && <p className="p-4 text-sm text-neutral-500">불러오는 중...</p>}
      {error && <p className="p-4 text-sm text-danger-500">{error}</p>}

      {!loading && !error && (
        <ViewComponent
          anchorDate={anchorDate}
          schedules={schedules}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onSelectSchedule={setSelectedSchedule}
        />
      )}

      {selectedSchedule && (
        <ScheduleDetail
          schedule={selectedSchedule}
          isLeader={isLeader}
          onEdit={() => {
            setFormState({ mode: 'edit', schedule: selectedSchedule });
            setSelectedSchedule(null);
          }}
          onClose={() => setSelectedSchedule(null)}
        />
      )}

      {formState && (
        <ScheduleForm
          mode={formState.mode}
          initialSchedule={formState.schedule}
          members={members}
          onSave={(input) =>
            formState.mode === 'create'
              ? createSchedule(input)
              : updateSchedule(formState.schedule.id, input)
          }
          onDelete={
            formState.mode === 'edit' ? () => deleteSchedule(formState.schedule.id) : undefined
          }
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
