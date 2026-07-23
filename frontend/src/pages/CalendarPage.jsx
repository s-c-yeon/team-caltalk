import { useState } from 'react';
import { useTeams } from '../hooks/useTeams';
import { TeamOnboarding } from '../components/teams/TeamOnboarding';
import { CalendarView } from '../components/calendar/CalendarView';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ChangeRequestList } from '../components/change-requests/ChangeRequestList';

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
  const isLeader = currentTeam.role === 'leader';

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

      <div className="grid h-[calc(100vh-56px)] grid-cols-[1fr_360px] gap-4 p-4">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <CalendarView
            teamId={currentTeam.id}
            isLeader={isLeader}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>
        <aside className="flex min-h-0 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <ChatPanel teamId={currentTeam.id} date={selectedDate} />
          </div>
          {isLeader && (
            <div className="max-h-64 shrink-0 overflow-auto rounded-lg border border-neutral-200 bg-white">
              <ChangeRequestList teamId={currentTeam.id} onNavigateToChat={setSelectedDate} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
