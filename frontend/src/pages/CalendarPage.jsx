import { useState } from 'react';
import { useTeams } from '../hooks/useTeams';
import { TeamOnboarding } from '../components/teams/TeamOnboarding';
import { CalendarView } from '../components/calendar/CalendarView';

export function CalendarPage() {
  const { teams, loading, currentTeamId, setCurrentTeamId } = useTeams();
  const [selectedDate, setSelectedDate] = useState(null);

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
      <div className="h-[calc(100vh-56px)] p-4">
        <section className="h-full overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <CalendarView
            teamId={currentTeam.id}
            isLeader={currentTeam.role === 'leader'}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>
      </div>
    </div>
  );
}
