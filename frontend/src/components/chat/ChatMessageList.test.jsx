import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageList } from './ChatMessageList';

const MEMBERS = [
  { user_id: 1, email: 'leader@caltalk.local', role: 'leader' },
  { user_id: 2, email: 'member@caltalk.local', role: 'member' },
];

describe('ChatMessageList', () => {
  it('이력이 없으면 빈 상태 문구를 표시함', () => {
    render(<ChatMessageList messages={[]} members={MEMBERS} />);
    expect(screen.getByText('이 날짜에는 아직 채팅 이력이 없습니다.')).toBeInTheDocument();
  });

  it('서버가 시간순으로 준 메시지를 그대로(재정렬 없이) 렌더링함(SC-05, BE-06 정렬 재사용)', () => {
    render(
      <ChatMessageList
        messages={[
          { id: 1, sender_id: 2, type: 'general', content: '첫 메시지', created_at: '2026-07-15T00:12:00.000Z' },
          { id: 2, sender_id: 1, type: 'general', content: '두 번째 메시지', created_at: '2026-07-15T00:30:00.000Z' },
        ]}
        members={MEMBERS}
      />
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('첫 메시지');
    expect(items[1]).toHaveTextContent('두 번째 메시지');
  });

  it("type='change_request' 메시지에만 [변경 요청] 배지가 표시됨", () => {
    render(
      <ChatMessageList
        messages={[
          { id: 1, sender_id: 2, type: 'general', content: '일반 메시지', created_at: '2026-07-15T00:12:00.000Z' },
          {
            id: 2,
            sender_id: 2,
            type: 'change_request',
            content: '변경 요청 메시지',
            created_at: '2026-07-15T00:20:00.000Z',
          },
        ]}
        members={MEMBERS}
      />
    );

    expect(screen.getAllByText('변경 요청')).toHaveLength(1);
  });

  it('sender_id를 팀원 목록의 email로 표시하고, 목록에 없으면 사용자 #id로 대체함', () => {
    render(
      <ChatMessageList
        messages={[
          { id: 1, sender_id: 1, type: 'general', content: '메시지1', created_at: '2026-07-15T00:12:00.000Z' },
          { id: 2, sender_id: 999, type: 'general', content: '메시지2', created_at: '2026-07-15T00:13:00.000Z' },
        ]}
        members={MEMBERS}
      />
    );

    expect(screen.getByText('leader@caltalk.local')).toBeInTheDocument();
    expect(screen.getByText('사용자 #999')).toBeInTheDocument();
  });
});
