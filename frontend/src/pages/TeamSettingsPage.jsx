import { useTeams } from '../hooks/useTeams';
import { TeamOnboarding } from '../components/teams/TeamOnboarding';
import { TeamSettings } from '../components/teams/TeamSettings';

export function TeamSettingsPage() {
  const { teams, loading, currentTeamId } = useTeams();

  if (loading) {
    return <p>불러오는 중...</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="team-settings-page">
        <p>소속된 팀이 없습니다.</p>
        <TeamOnboarding />
      </div>
    );
  }

  const currentTeam = teams.find((team) => team.id === currentTeamId) || teams[0];

  return (
    <div className="team-settings-page">
      <h1>팀 설정</h1>
      <TeamSettings team={currentTeam} />
    </div>
  );
}
