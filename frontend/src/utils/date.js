export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateString() {
  return toDateString(new Date());
}

export function shiftDate(dateStr, unit, amount) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (unit === 'month') {
    date.setMonth(date.getMonth() + amount);
  } else if (unit === 'week') {
    date.setDate(date.getDate() + amount * 7);
  } else {
    date.setDate(date.getDate() + amount);
  }
  return toDateString(date);
}

export function startOfWeekMonday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const diffToMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diffToMonday);
  return toDateString(date);
}

export function weekDates(dateStr) {
  const monday = startOfWeekMonday(dateStr);
  const [y, m, d] = monday.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    return toDateString(day);
  });
}

export function monthGrid(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function groupSchedulesByDate(schedules) {
  const map = {};
  for (const schedule of schedules) {
    const key = schedule.start_at.slice(0, 10);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(schedule);
  }
  return map;
}
