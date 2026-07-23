import { useEffect, useState } from 'react';
import * as teamsApi from '../api/teams.api';

export function useTeamMembers(teamId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    teamsApi
      .listTeamMembers(teamId)
      .then((data) => {
        if (!cancelled) {
          setMembers(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return { members, loading };
}
