import { useTeams } from '../hooks/useTeams';

export function TeamSettingsPage() {
  const { teams, loading } = useTeams();

  if (loading) {
    return <p>불러오는 중...</p>;
  }

  return (
    <div className="team-settings-page">
      <h1>팀 설정</h1>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            {team.name} — {team.role === 'leader' ? '팀장' : '팀원'}
          </li>
        ))}
      </ul>
      <p>팀 탈퇴 등 상세 관리 기능은 FE-11에서 구현 예정입니다.</p>
    </div>
  );
}
