import { useEffect, useState } from 'react';
import * as schedulesApi from '../api/schedules.api';

export function useSchedules(teamId, view, date) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) {
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    schedulesApi
      .getSchedules(teamId, view, date)
      .then((data) => {
        if (!cancelled) {
          setSchedules(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
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
  }, [teamId, view, date]);

  return { schedules, loading, error };
}
