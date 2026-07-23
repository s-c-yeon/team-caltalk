import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPage } from './CalendarPage';
import { useTeams } from '../hooks/useTeams';
import * as schedulesApi from '../api/schedules.api';
import * as teamsApi from '../api/teams.api';
import * as chatMessagesApi from '../api/chatMessages.api';
import * as scheduleChangeRequestsApi from '../api/scheduleChangeRequests.api';

vi.mock('../hooks/useTeams');
vi.mock('../api/schedules.api');
vi.mock('../api/teams.api');
vi.mock('../api/chatMessages.api');
vi.mock('../api/scheduleChangeRequests.api');

const SAMPLE_SCHEDULE = {
  id: 1,
  team_id: 5,
  title: '팀 회의',
  start_at: '2026-07-15T01:00:00.000Z',
  end_at: '2026-07-15T02:00:00.000Z',
  target_type: 'all',
  target_member_id: null,
};

describe('CalendarPage', () => {
  const setCurrentTeamId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    schedulesApi.getSchedules.mockResolvedValue([SAMPLE_SCHEDULE]);
    teamsApi.listTeamMembers.mockResolvedValue([]);
    chatMessagesApi.getChatMessages.mockResolvedValue([]);
    scheduleChangeRequestsApi.listChangeRequests.mockResolvedValue([]);
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

  describe('역할은 팀 소속에 종속됨(FE-06, SC-04)', () => {
    it('팀원 역할인 팀에서는 "+ 일정 추가" 버튼이 렌더링되지 않음', async () => {
      render(<CalendarPage />);

      await waitFor(() => {
        expect(schedulesApi.getSchedules).toHaveBeenCalled();
      });
      expect(screen.queryByRole('button', { name: '+ 일정 추가' })).not.toBeInTheDocument();
    });

    it('같은 사용자라도 팀장 역할인 다른 팀에서는 "+ 일정 추가" 버튼이 노출됨', async () => {
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
  });

  describe('캘린더-채팅 연동 레이아웃(FE-10)', () => {
    it('캘린더와 채팅 패널이 페이지 전환 없이 동시에 렌더링됨(SC-08)', async () => {
      render(<CalendarPage />);

      expect(await screen.findByText('팀 회의')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '월' })).toBeInTheDocument();
      expect(screen.getByText(/^채팅 ·/)).toBeInTheDocument();
    });

    it('날짜 클릭 시 페이지 이동 없이 채팅 패널의 조회 날짜가 갱신됨(SC-08)', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />);
      await screen.findByText('팀 회의');

      expect(chatMessagesApi.getChatMessages).not.toHaveBeenCalled();

      await user.click(screen.getByText('15'));

      await waitFor(() => {
        expect(chatMessagesApi.getChatMessages).toHaveBeenCalled();
      });
      const [, date] = chatMessagesApi.getChatMessages.mock.calls[0];
      expect(screen.getByText(`채팅 · ${date}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '월' })).toBeInTheDocument();
    });

    it('팀장은 ChangeRequestList가 함께 표시되고, "채팅으로 이동" 클릭 시 해당 날짜로 채팅 패널이 갱신됨', async () => {
      useTeams.mockReturnValue({
        teams: [{ id: 2, name: '팀장으로 소속된 팀', role: 'leader' }],
        loading: false,
        currentTeamId: 2,
        setCurrentTeamId,
      });
      scheduleChangeRequestsApi.listChangeRequests.mockResolvedValue([
        {
          id: 1,
          chat_message_id: 100,
          requested_by: 9,
          request_type: 'create',
          target_schedule_id: null,
          created_at: '2026-07-20T09:00:00.000Z',
          chat_message: {
            id: 100,
            team_id: 2,
            chat_date: '2026-07-20',
            sender_id: 9,
            type: 'change_request',
            content: '새 일정을 등록해주세요',
            created_at: '2026-07-20T09:00:00.000Z',
          },
        },
      ]);

      const user = userEvent.setup();
      render(<CalendarPage />);

      const requestRow = await screen.findByText(/신규 일정 요청/);
      await user.click(requestRow);
      await user.click(screen.getByRole('button', { name: '채팅으로 이동' }));

      await waitFor(() => {
        expect(chatMessagesApi.getChatMessages).toHaveBeenCalledWith(2, '2026-07-20');
      });
      expect(screen.getByText('채팅 · 2026-07-20')).toBeInTheDocument();
    });
  });

  describe('반응형 레이아웃(FE-12, 768px 기준선)', () => {
    it('데스크톱 폭에서는 탭 없이 캘린더+채팅 패널이 나란히 동시 렌더링됨', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      });

      render(<CalendarPage />);

      expect(await screen.findByText('팀 회의')).toBeInTheDocument();
      expect(screen.getByText(/^채팅 ·/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '캘린더' })).not.toBeInTheDocument();
    });

    it('모바일 폭에서는 상단 [캘린더]/[채팅] 탭으로 하나씩만 렌더링되고, 선택한 날짜는 탭 전환 후에도 유지됨(WF-09)', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      });

      const user = userEvent.setup();
      render(<CalendarPage />);

      expect(await screen.findByText('팀 회의')).toBeInTheDocument();
      expect(screen.queryByText(/^채팅 ·/)).not.toBeInTheDocument();

      await user.click(screen.getByText('15'));
      await user.click(screen.getByRole('button', { name: '채팅' }));

      expect(screen.queryByText('팀 회의')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(chatMessagesApi.getChatMessages).toHaveBeenCalled();
      });
      const [, date] = chatMessagesApi.getChatMessages.mock.calls[0];
      expect(screen.getByText(`채팅 · ${date}`)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '캘린더' }));
      expect(await screen.findByText('팀 회의')).toBeInTheDocument();
    });
  });
});
