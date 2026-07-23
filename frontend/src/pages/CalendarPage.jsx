import { useState } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { TeamOnboarding } from '../components/teams/TeamOnboarding';
import { CalendarView } from '../components/calendar/CalendarView';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ChangeRequestList } from '../components/change-requests/ChangeRequestList';

export function CalendarPage() {
  const { teams, loading, currentTeamId } = useTeams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [mobileTab, setMobileTab] = useState('calendar');
  const isDesktop = useIsDesktop();

  if (loading) {
    return <p>불러오는 중...</p>;
  }

  if (teams.length === 0) {
    return <TeamOnboarding />;
  }

  const currentTeam = teams.find((team) => team.id === currentTeamId) || teams[0];
  const isLeader = currentTeam.role === 'leader';

  // 모바일 폭에서는 두 패널을 동시에 마운트하지 않고 탭으로 하나씩만 렌더링한다
  // (APP_STYLE_GUIDE.md §4.4 "불필요한 DOM 유지 금지").
  const showCalendar = isDesktop || mobileTab === 'calendar';
  const showChat = isDesktop || mobileTab === 'chat';

  return (
    <div className="calendar-page">
      {!isDesktop && (
        <div className="flex h-12 items-center border-b border-neutral-200 p-2">
          <div className="inline-flex overflow-hidden rounded-md border border-neutral-200">
            <button
              type="button"
              onClick={() => setMobileTab('calendar')}
              className={`px-3 py-1.5 text-sm font-medium ${
                mobileTab === 'calendar'
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              캘린더
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={`border-l border-neutral-200 px-3 py-1.5 text-sm font-medium ${
                mobileTab === 'chat'
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              채팅
            </button>
          </div>
        </div>
      )}

      <div className="grid h-[calc(100vh-104px)] grid-cols-1 gap-4 p-4 md:h-[calc(100vh-56px)] md:grid-cols-[1fr_360px]">
        {showCalendar && (
          <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <CalendarView
              teamId={currentTeam.id}
              isLeader={isLeader}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </section>
        )}
        {showChat && (
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
        )}
      </div>
    </div>
  );
}
