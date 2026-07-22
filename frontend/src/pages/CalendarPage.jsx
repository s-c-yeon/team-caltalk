import { useTeams } from '../hooks/useTeams';
import { TeamOnboarding } from '../components/teams/TeamOnboarding';

export function CalendarPage() {
  const { teams, loading, currentTeamId, setCurrentTeamId } = useTeams();

  if (loading) {
    return <p>불러오는 중...</p>;
  }

  if (teams.length === 0) {
    return <TeamOnboarding />;
  }

  const currentTeam = teams.find((team) => team.id === currentTeamId) || teams[0];

  return (
    <div className="calendar-page">
      <label>
        팀 전환
        <select
          value={currentTeam.id}
          onChange={(e) => setCurrentTeamId(Number(e.target.value))}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.role === 'leader' ? '팀장' : '팀원'})
            </option>
          ))}
        </select>
      </label>
      <p>
        {currentTeam.name} 캘린더 (곧 구현 예정 — FE-04)
      </p>
    </div>
  );
}
