import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarView } from './CalendarView';
import * as schedulesApi from '../../api/schedules.api';

vi.mock('../../api/schedules.api');

const SAMPLE_SCHEDULE = {
  id: 1,
  team_id: 5,
  title: '팀 회의',
  start_at: '2026-07-15T01:00:00.000Z',
  end_at: '2026-07-15T02:00:00.000Z',
  target_type: 'all',
  target_member_id: null,
};

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    schedulesApi.getSchedules.mockResolvedValue([SAMPLE_SCHEDULE]);
  });

  it('기본 진입 시 월 뷰로 currentTeamId 기준 일정을 조회함(BR-08)', async () => {
    render(<CalendarView teamId="5" selectedDate="2026-07-15" onSelectDate={() => {}} />);

    await waitFor(() => {
      expect(schedulesApi.getSchedules).toHaveBeenCalledWith('5', 'month', '2026-07-15');
    });
    expect(await screen.findByText('팀 회의')).toBeInTheDocument();
  });

  it('월→주→일 전환 시 같은 팀 일정이 대응 단위로 재조회됨(SC-01)', async () => {
    const user = userEvent.setup();
    render(<CalendarView teamId="5" selectedDate="2026-07-15" onSelectDate={() => {}} />);
    await screen.findByText('팀 회의');

    await user.click(screen.getByRole('button', { name: '주' }));
    await waitFor(() => {
      expect(schedulesApi.getSchedules).toHaveBeenCalledWith('5', 'week', '2026-07-15');
    });

    await user.click(screen.getByRole('button', { name: '일' }));
    await waitFor(() => {
      expect(schedulesApi.getSchedules).toHaveBeenCalledWith('5', 'day', '2026-07-15');
    });
  });

  it('일정 클릭 시 읽기 전용 상세가 표시됨', async () => {
    const user = userEvent.setup();
    render(<CalendarView teamId="5" selectedDate="2026-07-15" onSelectDate={() => {}} />);

    const scheduleButton = await screen.findByText('팀 회의');
    await user.click(scheduleButton);

    expect(await screen.findByText('시작:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('팀 전체', { exact: false })).toBeInTheDocument();
  });
});
