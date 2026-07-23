import { describe, expect, it } from 'vitest';
import { groupSchedulesByDate, monthGrid, shiftDate, weekDates } from './date';

describe('monthGrid', () => {
  it('2026년 7월 그리드가 7의 배수 길이이며 1일이 올바른 요일에 위치함', () => {
    const weeks = monthGrid('2026-07-15');
    const flat = weeks.flat();
    expect(flat.length % 7).toBe(0);

    const firstIndex = flat.indexOf('2026-07-01');
    expect(firstIndex).toBe(new Date(2026, 6, 1).getDay());

    const lastIndex = flat.indexOf('2026-07-31');
    expect(lastIndex).toBeGreaterThan(firstIndex);
  });
});

describe('weekDates', () => {
  it('월요일 시작으로 7일을 반환하며 백엔드(BE-04)의 주간 범위와 정합됨', () => {
    const dates = weekDates('2026-07-15');
    expect(dates).toHaveLength(7);
    expect(new Date(dates[0]).getDay()).toBe(1);
    expect(dates).toContain('2026-07-15');
    expect(dates[0]).toBe('2026-07-13');
    expect(dates[6]).toBe('2026-07-19');
  });
});

describe('shiftDate', () => {
  it('month 단위로 이동 시 다음 달 같은 날짜를 반환함', () => {
    expect(shiftDate('2026-07-15', 'month', 1)).toBe('2026-08-15');
    expect(shiftDate('2026-07-15', 'month', -1)).toBe('2026-06-15');
  });

  it('week 단위로 이동 시 7일 이동함', () => {
    expect(shiftDate('2026-07-15', 'week', 1)).toBe('2026-07-22');
  });

  it('day 단위로 이동 시 1일 이동함', () => {
    expect(shiftDate('2026-07-31', 'day', 1)).toBe('2026-08-01');
  });
});

describe('groupSchedulesByDate', () => {
  it('start_at 날짜(YYYY-MM-DD) 기준으로 일정을 그룹화함', () => {
    const schedules = [
      { id: 1, start_at: '2026-07-15T01:00:00.000Z' },
      { id: 2, start_at: '2026-07-15T05:00:00.000Z' },
      { id: 3, start_at: '2026-07-16T01:00:00.000Z' },
    ];
    const grouped = groupSchedulesByDate(schedules);
    expect(grouped['2026-07-15']).toHaveLength(2);
    expect(grouped['2026-07-16']).toHaveLength(1);
  });
});
