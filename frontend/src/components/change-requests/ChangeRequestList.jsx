import { useState } from 'react';
import { useScheduleChangeRequests } from '../../hooks/useScheduleChangeRequests';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import * as schedulesApi from '../../api/schedules.api';
import { ScheduleForm } from '../calendar/ScheduleForm';

const REQUEST_TYPE_LABELS = { create: '신규', update: '수정', cancel: '취소' };

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ChangeRequestList({ teamId, onNavigateToChat }) {
  const { changeRequests, loading, error } = useScheduleChangeRequests(teamId);
  const { members } = useTeamMembers(teamId);
  const [expandedId, setExpandedId] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formError, setFormError] = useState(null);

  function resolveRequester(userId) {
    const member = members.find((m) => String(m.user_id) === String(userId));
    return member ? member.email : `사용자 #${userId}`;
  }

  async function handleOpenScheduleForm(request) {
    setFormError(null);
    if (request.request_type === 'create' || !request.target_schedule_id) {
      setEditingSchedule({ mode: 'create' });
      return;
    }
    try {
      const schedule = await schedulesApi.getSchedule(teamId, request.target_schedule_id);
      setEditingSchedule({ mode: 'edit', schedule });
    } catch (err) {
      setFormError(err.message);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-neutral-500">불러오는 중...</p>;
  }
  if (error) {
    return <p className="p-4 text-sm text-danger-500">{error}</p>;
  }
  if (changeRequests.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">미반영 변경 요청이 없습니다.</p>;
  }

  return (
    <div className="divide-y divide-neutral-200">
      {formError && <p className="p-3 text-xs text-danger-500">{formError}</p>}

      {changeRequests.map((request) => (
        <div key={request.id} className="p-3">
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
            className="flex w-full items-center justify-between text-left text-sm text-neutral-800"
          >
            <span>
              {resolveRequester(request.requested_by)} · {REQUEST_TYPE_LABELS[request.request_type]} ·{' '}
              {request.target_schedule_id ? `대상 일정 #${request.target_schedule_id}` : '신규 일정 요청'}
            </span>
            <span className="text-xs text-neutral-400">{formatDateTime(request.created_at)}</span>
          </button>

          {expandedId === request.id && (
            <div className="mt-2 space-y-2 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
              <p>요청 유형: {REQUEST_TYPE_LABELS[request.request_type]}</p>
              <p>요청 일시: {formatDateTime(request.created_at)}</p>
              <p>원본 채팅 메시지: &quot;{request.chat_message.content}&quot;</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToChat?.(request.chat_message.chat_date)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  채팅으로 이동
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenScheduleForm(request)}
                  className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600"
                >
                  일정으로 이동해 직접 수정
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editingSchedule && (
        <ScheduleForm
          mode={editingSchedule.mode}
          initialSchedule={editingSchedule.schedule}
          members={members}
          onSave={(input) =>
            editingSchedule.mode === 'create'
              ? schedulesApi.createSchedule(teamId, input)
              : schedulesApi.updateSchedule(teamId, editingSchedule.schedule.id, input)
          }
          onDelete={
            editingSchedule.mode === 'edit'
              ? () => schedulesApi.deleteSchedule(teamId, editingSchedule.schedule.id)
              : undefined
          }
          onClose={() => setEditingSchedule(null)}
        />
      )}
    </div>
  );
}
