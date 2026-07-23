import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPage } from './CalendarPage';
import { useTeams } from '../hooks/useTeams';
import * as schedulesApi from '../api/schedules.api';
import * as teamsApi from '../api/teams.api';

vi.mock('../hooks/useTeams');
vi.mock('../api/schedules.api');
vi.mock('../api/teams.api');

describe('CalendarPage — 역할은 팀 소속에 종속됨(FE-06, SC-04)', () => {
  const setCurrentTeamId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    schedulesApi.getSchedules.mockResolvedValue([]);
    teamsApi.listTeamMembers.mockResolvedValue([]);
    useTeams.mockReturnValue({
      teams: [
        { id: 1, name: '팀원으로 소속된 팀', role: 'member' },
        { id: 2, name: '팀장으로 소속된 팀', role: 'leader' },
      ],
      loading: false,
      currentTeamId: 1,
      setCurrentTeamId,
    });
  });

  it('팀원 역할인 팀에서는 "+ 일정 추가" 버튼이 렌더링되지 않음', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(schedulesApi.getSchedules).toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: '+ 일정 추가' })).not.toBeInTheDocument();
  });

  it('같은 사용자라도 팀장 역할인 다른 팀에서는 "+ 일정 추가" 버튼이 노출됨(역할은 팀 소속에 종속)', async () => {
    useTeams.mockReturnValue({
      teams: [
        { id: 1, name: '팀원으로 소속된 팀', role: 'member' },
        { id: 2, name: '팀장으로 소속된 팀', role: 'leader' },
      ],
      loading: false,
      currentTeamId: 2,
      setCurrentTeamId,
    });

    render(<CalendarPage />);

    expect(await screen.findByRole('button', { name: '+ 일정 추가' })).toBeInTheDocument();
  });

  it('팀 전환 select를 변경하면 setCurrentTeamId가 선택한 팀 id로 호출됨', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    await user.selectOptions(screen.getByLabelText('팀 전환'), '2');
    expect(setCurrentTeamId).toHaveBeenCalledWith(2);
  });
});
