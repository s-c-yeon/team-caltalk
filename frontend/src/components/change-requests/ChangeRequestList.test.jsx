import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeRequestList } from './ChangeRequestList';
import * as scheduleChangeRequestsApi from '../../api/scheduleChangeRequests.api';
import * as teamsApi from '../../api/teams.api';
import * as schedulesApi from '../../api/schedules.api';

vi.mock('../../api/scheduleChangeRequests.api');
vi.mock('../../api/teams.api');
vi.mock('../../api/schedules.api');

const MEMBERS = [{ user_id: 7, email: 'member@caltalk.local', role: 'member' }];

const REQUEST = {
  id: 1,
  chat_message_id: 100,
  requested_by: 7,
  request_type: 'update',
  target_schedule_id: 55,
  created_at: '2026-07-15T09:20:00.000Z',
  chat_message: {
    id: 100,
    team_id: 5,
    chat_date: '2026-07-15',
    sender_id: 7,
    type: 'change_request',
    content: '다음 주 화요일 회의를 3시로 옮겼으면 합니다',
    created_at: '2026-07-15T09:20:00.000Z',
  },
};

describe('ChangeRequestList (FE-09, SC-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teamsApi.listTeamMembers.mockResolvedValue(MEMBERS);
    scheduleChangeRequestsApi.listChangeRequests.mockResolvedValue([REQUEST]);
  });

  it('미반영 요청 목록을 표시함(FR-10)', async () => {
    render(<ChangeRequestList teamId="5" />);

    expect(await screen.findByText(/member@caltalk.local/)).toBeInTheDocument();
    expect(screen.getByText(/대상 일정 #55/)).toBeInTheDocument();
  });

  it('항목 클릭 시 원본 채팅 메시지 원문·요청 유형이 표시됨(SC-07)', async () => {
    const user = userEvent.setup();
    render(<ChangeRequestList teamId="5" />);

    await user.click(await screen.findByText(/member@caltalk.local/));

    expect(
      screen.getByText(/다음 주 화요일 회의를 3시로 옮겼으면 합니다/)
    ).toBeInTheDocument();
    expect(screen.getByText('요청 유형: 수정')).toBeInTheDocument();
  });

  it('승인/반려 버튼이나 상태 배지가 화면 어디에도 존재하지 않음(§1.2, §10.2)', async () => {
    const user = userEvent.setup();
    render(<ChangeRequestList teamId="5" />);
    await user.click(await screen.findByText(/member@caltalk.local/));

    expect(screen.queryByText('승인')).not.toBeInTheDocument();
    expect(screen.queryByText('반려')).not.toBeInTheDocument();
    expect(screen.queryByText(/상태/)).not.toBeInTheDocument();
  });

  it('"채팅으로 이동" 클릭 시 onNavigateToChat이 원본 메시지 날짜로 호출됨', async () => {
    const user = userEvent.setup();
    const onNavigateToChat = vi.fn();
    render(<ChangeRequestList teamId="5" onNavigateToChat={onNavigateToChat} />);

    await user.click(await screen.findByText(/member@caltalk.local/));
    await user.click(screen.getByRole('button', { name: '채팅으로 이동' }));

    expect(onNavigateToChat).toHaveBeenCalledWith('2026-07-15');
  });

  it('"일정으로 이동해 직접 수정" 클릭 시 대상 일정을 조회해 FE-05 ScheduleForm을 기존 값으로 염', async () => {
    schedulesApi.getSchedule.mockResolvedValue({
      id: 55,
      title: '팀회의',
      start_at: '2026-07-22T05:00:00.000Z',
      end_at: '2026-07-22T06:00:00.000Z',
      target_type: 'all',
      target_member_id: null,
    });

    const user = userEvent.setup();
    render(<ChangeRequestList teamId="5" />);
    await user.click(await screen.findByText(/member@caltalk.local/));
    await user.click(screen.getByRole('button', { name: '일정으로 이동해 직접 수정' }));

    await waitFor(() => {
      expect(schedulesApi.getSchedule).toHaveBeenCalledWith('5', 55);
    });
    expect(await screen.findByLabelText('제목')).toHaveValue('팀회의');
    expect(screen.getByRole('heading', { name: '일정 수정' })).toBeInTheDocument();
  });

  it('폼으로 일정을 저장해도 변경 요청 레코드에 대한 API는 전혀 호출되지 않음(요청 레코드는 건드리지 않음)', async () => {
    schedulesApi.getSchedule.mockResolvedValue({
      id: 55,
      title: '팀회의',
      start_at: '2026-07-22T05:00:00.000Z',
      end_at: '2026-07-22T06:00:00.000Z',
      target_type: 'all',
      target_member_id: null,
    });
    schedulesApi.updateSchedule.mockResolvedValue({});

    const user = userEvent.setup();
    render(<ChangeRequestList teamId="5" />);
    await user.click(await screen.findByText(/member@caltalk.local/));
    await user.click(screen.getByRole('button', { name: '일정으로 이동해 직접 수정' }));
    await screen.findByLabelText('제목');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(schedulesApi.updateSchedule).toHaveBeenCalledWith('5', 55, expect.any(Object));
    });
    expect(scheduleChangeRequestsApi.listChangeRequests).toHaveBeenCalledTimes(1);
  });
});
