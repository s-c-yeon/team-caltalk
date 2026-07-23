import { useChatMessages } from '../../hooks/useChatMessages';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { ChatMessageList } from './ChatMessageList';

export function ChatPanel({ teamId, date }) {
  const { messages, loading, error } = useChatMessages(teamId, date);
  const { members } = useTeamMembers(teamId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 p-3 text-sm font-medium text-neutral-900">
        채팅 · {date || '날짜를 선택하세요'}
      </div>

      {!date && (
        <p className="p-4 text-sm text-neutral-500">
          캘린더에서 날짜를 선택하면 채팅 이력이 표시됩니다.
        </p>
      )}
      {date && loading && <p className="p-4 text-sm text-neutral-500">불러오는 중...</p>}
      {date && error && <p className="p-4 text-sm text-danger-500">{error}</p>}
      {date && !loading && !error && <ChatMessageList messages={messages} members={members} />}
    </div>
  );
}
