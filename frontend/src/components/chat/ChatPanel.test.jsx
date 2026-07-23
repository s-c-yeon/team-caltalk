import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import * as chatMessagesApi from '../../api/chatMessages.api';
import * as teamsApi from '../../api/teams.api';

vi.mock('../../api/chatMessages.api');
vi.mock('../../api/teams.api');

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teamsApi.listTeamMembers.mockResolvedValue([]);
  });

  it('date가 없으면 API를 호출하지 않고 날짜 선택 안내를 표시함', () => {
    render(<ChatPanel teamId="5" date={null} />);

    expect(chatMessagesApi.getChatMessages).not.toHaveBeenCalled();
    expect(
      screen.getByText('캘린더에서 날짜를 선택하면 채팅 이력이 표시됩니다.')
    ).toBeInTheDocument();
  });

  it('date가 주어지면 팀ID+날짜로 이력을 조회하고 시간순으로 표시함(BR-06)', async () => {
    chatMessagesApi.getChatMessages.mockResolvedValue([
      { id: 1, sender_id: 2, type: 'general', content: '안녕하세요', created_at: '2026-07-15T00:12:00.000Z' },
    ]);

    render(<ChatPanel teamId="5" date="2026-07-15" />);

    await waitFor(() => {
      expect(chatMessagesApi.getChatMessages).toHaveBeenCalledWith('5', '2026-07-15');
    });
    expect(await screen.findByText('안녕하세요')).toBeInTheDocument();
    expect(screen.getByText('채팅 · 2026-07-15')).toBeInTheDocument();
  });

  it('이력이 없는 날짜는 빈 상태가 정상 표시됨', async () => {
    chatMessagesApi.getChatMessages.mockResolvedValue([]);

    render(<ChatPanel teamId="5" date="2026-07-16" />);

    expect(
      await screen.findByText('이 날짜에는 아직 채팅 이력이 없습니다.')
    ).toBeInTheDocument();
  });
});
