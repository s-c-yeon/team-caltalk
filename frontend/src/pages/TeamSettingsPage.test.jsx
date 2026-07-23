import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamSettingsPage } from './TeamSettingsPage';
import { useTeams } from '../hooks/useTeams';
import { useTeamMembers } from '../hooks/useTeamMembers';

vi.mock('../hooks/useTeams');
vi.mock('../hooks/useTeamMembers');

describe('TeamSettingsPage (EX-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTeamMembers.mockReturnValue({ members: [], loading: false });
  });

  it('소속 팀이 없으면 "소속 팀 없음" 안내와 팀 생성/가입 화면(TeamOnboarding)을 표시함', () => {
    useTeams.mockReturnValue({
      teams: [],
      loading: false,
      currentTeamId: null,
      createTeam: vi.fn(),
      joinTeam: vi.fn(),
    });

    render(<TeamSettingsPage />);

    expect(screen.getByText('소속된 팀이 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('팀 생성')).toBeInTheDocument();
    expect(screen.getByText('초대 코드로 가입')).toBeInTheDocument();
  });

  it('소속 팀이 있으면 현재 팀의 설정 화면을 표시함', () => {
    useTeams.mockReturnValue({
      teams: [{ id: 1, name: '개발1팀', role: 'leader' }],
      loading: false,
      currentTeamId: 1,
      leaveTeam: vi.fn(),
    });

    render(<TeamSettingsPage />);

    expect(screen.getByText('팀 이름: 개발1팀')).toBeInTheDocument();
  });
});
