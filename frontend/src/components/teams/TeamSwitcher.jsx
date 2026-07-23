import { useEffect, useRef, useState } from 'react';
import { useTeams } from '../../hooks/useTeams';

export function TeamSwitcher() {
  const { teams, currentTeamId, setCurrentTeamId } = useTeams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (teams.length === 0) {
    return null;
  }

  const currentTeam = teams.find((team) => team.id === currentTeamId) || teams[0];

  function handleSelect(teamId) {
    setCurrentTeamId(teamId);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        {currentTeam.name} <span className="text-neutral-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleSelect(team.id)}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                team.id === currentTeam.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-900'
              }`}
            >
              <span>{team.name}</span>
              <span
                className={`text-xs ${
                  team.id === currentTeam.id ? 'text-primary-500' : 'text-neutral-400'
                }`}
              >
                {team.role === 'leader' ? '팀장' : '팀원'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
