import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import * as teamsApi from '../api/teams.api';

const CURRENT_TEAM_STORAGE_KEY = 'team-caltalk:currentTeamId';

export const CurrentTeamContext = createContext(null);

export function CurrentTeamProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState(() => {
    const stored = localStorage.getItem(CURRENT_TEAM_STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const list = await teamsApi.listMyTeams();
      setTeams(list);
      return list;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentTeamId && teams.length > 0) {
      setCurrentTeamId(teams[0].id);
    }
  }, [teams, currentTeamId]);

  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem(CURRENT_TEAM_STORAGE_KEY, String(currentTeamId));
    } else {
      localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
    }
  }, [currentTeamId]);

  async function createTeam(name) {
    const team = await teamsApi.createTeam(name);
    await refresh();
    setCurrentTeamId(team.id);
    return team;
  }

  async function joinTeam(teamId, inviteCode) {
    const membership = await teamsApi.joinTeam(teamId, inviteCode);
    await refresh();
    setCurrentTeamId(teamId);
    return membership;
  }

  return (
    <CurrentTeamContext.Provider
      value={{ teams, loading, currentTeamId, setCurrentTeamId, createTeam, joinTeam, refresh }}
    >
      {children}
    </CurrentTeamContext.Provider>
  );
}
