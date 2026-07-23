import { ChangeRequestBadge } from './ChangeRequestBadge';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function resolveSenderLabel(senderId, members) {
  const member = members.find((m) => String(m.user_id) === String(senderId));
  return member ? member.email : `사용자 #${senderId}`;
}

export function ChatMessageList({ messages, members }) {
  if (messages.length === 0) {
    return (
      <p className="p-4 text-sm text-neutral-500">이 날짜에는 아직 채팅 이력이 없습니다.</p>
    );
  }

  return (
    <ul className="flex-1 space-y-1.5 overflow-auto p-3">
      {messages.map((message) => (
        <li key={message.id} className="flex items-start gap-2 py-1.5">
          <span className="w-10 shrink-0 text-xs text-neutral-400">
            {formatTime(message.created_at)}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-600">
                {resolveSenderLabel(message.sender_id, members)}
              </span>
              {message.type === 'change_request' && <ChangeRequestBadge />}
            </div>
            <p className="mt-0.5 text-sm text-neutral-800">{message.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
