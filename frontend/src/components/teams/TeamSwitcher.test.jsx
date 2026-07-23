import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSwitcher } from './TeamSwitcher';
import { useTeams } from '../../hooks/useTeams';

vi.mock('../../hooks/useTeams');

describe('TeamSwitcher (WF-07)', () => {
  const setCurrentTeamId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useTeams.mockReturnValue({
      teams: [
        { id: 1, name: '개발1팀', role: 'leader' },
        { id: 2, name: '개발2팀', role: 'member' },
      ],
      currentTeamId: 1,
      setCurrentTeamId,
    });
  });

  it('소속 팀이 없으면 아무것도 렌더링하지 않음', () => {
    useTeams.mockReturnValue({ teams: [], currentTeamId: null, setCurrentTeamId });
    const { container } = render(<TeamSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('현재 팀 이름을 버튼에 표시하고, 클릭하면 팀 목록 드롭다운이 열림', async () => {
    const user = userEvent.setup();
    render(<TeamSwitcher />);

    expect(screen.getByRole('button', { name: /개발1팀/ })).toBeInTheDocument();
    expect(screen.queryByText('개발2팀')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /개발1팀/ }));
    expect(screen.getByText('개발2팀')).toBeInTheDocument();
  });

  it('다른 팀을 선택하면 CurrentTeamContext의 setCurrentTeamId가 호출됨', async () => {
    const user = userEvent.setup();
    render(<TeamSwitcher />);

    await user.click(screen.getByRole('button', { name: /개발1팀/ }));
    await user.click(screen.getByText('개발2팀'));

    expect(setCurrentTeamId).toHaveBeenCalledWith(2);
  });
});
