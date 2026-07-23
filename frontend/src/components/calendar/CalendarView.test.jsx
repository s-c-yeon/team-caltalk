import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarView } from './CalendarView';
import * as schedulesApi from '../../api/schedules.api';
import * as teamsApi from '../../api/teams.api';

vi.mock('../../api/schedules.api');
vi.mock('../../api/teams.api');

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
    schedulesApi.createSchedule.mockResolvedValue({});
    teamsApi.listTeamMembers.mockResolvedValue([]);
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

  it('팀원(isLeader=false)에게는 "+ 일정 추가" 버튼과 상세의 "수정" 버튼이 노출되지 않음(BR-04)', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        teamId="5"
        isLeader={false}
        selectedDate="2026-07-15"
        onSelectDate={() => {}}
      />
    );

    await screen.findByText('팀 회의');
    expect(screen.queryByRole('button', { name: '+ 일정 추가' })).not.toBeInTheDocument();

    await user.click(screen.getByText('팀 회의'));
    expect(await screen.findByText('시작:', { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
  });

  it('팀장(isLeader=true)은 "+ 일정 추가"로 생성 폼을 열고 제출하면 createSchedule이 호출됨(SC-02)', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView teamId="5" isLeader selectedDate="2026-07-15" onSelectDate={() => {}} />
    );
    await screen.findByText('팀 회의');

    await user.click(screen.getByRole('button', { name: '+ 일정 추가' }));
    await user.type(screen.getByLabelText('제목'), '새 일정');
    await user.type(screen.getByLabelText('시작 일시'), '2026-08-01T14:00');
    await user.type(screen.getByLabelText('종료 일시'), '2026-08-01T15:00');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(schedulesApi.createSchedule).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ title: '새 일정' })
      );
    });
  });

  it('팀장은 상세의 "수정" 버튼으로 기존 값이 채워진 수정 폼을 열 수 있음', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView teamId="5" isLeader selectedDate="2026-07-15" onSelectDate={() => {}} />
    );

    await user.click(await screen.findByText('팀 회의'));
    await user.click(await screen.findByRole('button', { name: '수정' }));

    expect(screen.getByLabelText('제목')).toHaveValue('팀 회의');
    expect(screen.getByRole('heading', { name: '일정 수정' })).toBeInTheDocument();
  });
});
