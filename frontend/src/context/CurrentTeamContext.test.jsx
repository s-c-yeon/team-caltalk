import { useContext } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from './AuthContext';
import { CurrentTeamContext, CurrentTeamProvider } from './CurrentTeamContext';
import * as teamsApi from '../api/teams.api';

vi.mock('../api/teams.api');

function TestConsumer() {
  const { teams, currentTeamId, leaveTeam } = useContext(CurrentTeamContext);
  return (
    <div>
      <p>teams: {teams.map((t) => t.id).join(',') || '없음'}</p>
      <p>currentTeamId: {currentTeamId ?? '없음'}</p>
      <button type="button" onClick={() => leaveTeam(currentTeamId)}>
        탈퇴
      </button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <AuthContext.Provider value={{ user: { id: 1, email: 'leader@caltalk.local' } }}>
      <CurrentTeamProvider>
        <TestConsumer />
      </CurrentTeamProvider>
    </AuthContext.Provider>
  );
}

describe('CurrentTeamContext.leaveTeam (FE-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('탈퇴한 팀이 마지막 소속 팀이면 currentTeamId가 null로 재설정됨(EX-04)', async () => {
    teamsApi.listMyTeams.mockResolvedValueOnce([{ id: 10, name: '개발1팀', role: 'leader' }]);
    teamsApi.leaveTeam.mockResolvedValue({});
    teamsApi.listMyTeams.mockResolvedValueOnce([]);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('currentTeamId: 10')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '탈퇴' }));

    await waitFor(() => {
      expect(teamsApi.leaveTeam).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(screen.getByText('teams: 없음')).toBeInTheDocument();
    });
    expect(screen.getByText('currentTeamId: 없음')).toBeInTheDocument();
  });

  it('다른 소속 팀이 남아있으면 currentTeamId가 남은 팀 중 하나로 갱신됨', async () => {
    teamsApi.listMyTeams.mockResolvedValueOnce([
      { id: 10, name: '개발1팀', role: 'leader' },
      { id: 20, name: '개발2팀', role: 'member' },
    ]);
    teamsApi.leaveTeam.mockResolvedValue({});
    teamsApi.listMyTeams.mockResolvedValueOnce([{ id: 20, name: '개발2팀', role: 'member' }]);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('currentTeamId: 10')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '탈퇴' }));

    await waitFor(() => {
      expect(screen.getByText('currentTeamId: 20')).toBeInTheDocument();
    });
  });
});
