import { useState } from 'react';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useTeams } from '../../hooks/useTeams';

export function TeamSettings({ team }) {
  const { members, loading } = useTeamMembers(team.id);
  const { leaveTeam } = useTeams();
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const isSoleLeader =
    team.role === 'leader' && members.filter((m) => m.role === 'leader').length <= 1;

  async function handleLeave() {
    setError(null);
    setLeaving(true);
    try {
      await leaveTeam(team.id);
    } catch (err) {
      setError(err.message);
      setLeaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">불러오는 중...</p>;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-base font-semibold text-neutral-900">팀 이름: {team.name}</h2>

      <h3 className="mt-4 text-sm font-medium text-neutral-700">팀원 목록</h3>
      <ul className="mt-1 space-y-1 text-sm text-neutral-800">
        {members.map((member) => (
          <li key={member.user_id}>
            {member.email} ({member.role === 'leader' ? '팀장' : '팀원'})
            {isSoleLeader && member.role === 'leader' ? ' — 유일한 팀장' : ''}
          </li>
        ))}
      </ul>

      {isSoleLeader && (
        <div className="mt-4 rounded-md border border-danger-400 bg-danger-50 p-3 text-sm text-danger-600">
          ⚠ 탈퇴할 수 없습니다. 이 팀에는 다른 팀장이 없습니다.
          <br />
          먼저 다른 팀원을 팀장으로 지정한 뒤 다시 시도해주세요.
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleLeave}
          disabled={isSoleLeader || leaving}
          className="rounded-md border border-danger-500 px-3 py-1.5 text-sm font-medium text-danger-500 hover:bg-danger-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          이 팀에서 탈퇴
        </button>
      </div>
    </div>
  );
}
