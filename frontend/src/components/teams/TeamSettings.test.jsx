import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSettings } from './TeamSettings';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useTeams } from '../../hooks/useTeams';

vi.mock('../../hooks/useTeamMembers');
vi.mock('../../hooks/useTeams');

describe('TeamSettings (WF-08)', () => {
  const leaveTeam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    leaveTeam.mockResolvedValue();
    useTeams.mockReturnValue({ leaveTeam });
  });

  it('정상 상태: 팀원 목록과 활성화된 "이 팀에서 탈퇴" 버튼을 표시함', () => {
    useTeamMembers.mockReturnValue({
      members: [
        { user_id: 1, email: 'leader@caltalk.local', role: 'leader' },
        { user_id: 2, email: 'other-leader@caltalk.local', role: 'leader' },
      ],
      loading: false,
    });

    render(<TeamSettings team={{ id: 5, name: '개발1팀', role: 'leader' }} />);

    expect(screen.getByText(/^leader@caltalk\.local/)).toBeInTheDocument();
    expect(screen.getByText(/other-leader@caltalk\.local/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이 팀에서 탈퇴' })).toBeEnabled();
    expect(screen.queryByText(/탈퇴할 수 없습니다/)).not.toBeInTheDocument();
  });

  it('차단 상태: 유일한 팀장이면 경고 문구와 비활성화된 버튼을 표시함(EX-01)', () => {
    useTeamMembers.mockReturnValue({
      members: [{ user_id: 1, email: 'sole-leader@caltalk.local', role: 'leader' }],
      loading: false,
    });

    render(<TeamSettings team={{ id: 5, name: '개발1팀', role: 'leader' }} />);

    expect(
      screen.getByText(/탈퇴할 수 없습니다. 이 팀에는 다른 팀장이 없습니다/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이 팀에서 탈퇴' })).toBeDisabled();
  });

  it('정상 상태에서 탈퇴 버튼 클릭 시 leaveTeam(teamId)가 호출됨', async () => {
    useTeamMembers.mockReturnValue({
      members: [
        { user_id: 1, email: 'leader@caltalk.local', role: 'leader' },
        { user_id: 2, email: 'member@caltalk.local', role: 'member' },
      ],
      loading: false,
    });

    const user = userEvent.setup();
    render(<TeamSettings team={{ id: 5, name: '개발1팀', role: 'member' }} />);

    await user.click(screen.getByRole('button', { name: '이 팀에서 탈퇴' }));
    expect(leaveTeam).toHaveBeenCalledWith(5);
  });
});
