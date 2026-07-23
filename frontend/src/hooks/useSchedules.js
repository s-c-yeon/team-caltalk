import { useCallback, useEffect, useState } from 'react';
import * as schedulesApi from '../api/schedules.api';

export function useSchedules(teamId, view, date) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(() => {
    if (!teamId) {
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    return schedulesApi
      .getSchedules(teamId, view, date)
      .then((data) => setSchedules(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [teamId, view, date]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  async function createSchedule(input) {
    await schedulesApi.createSchedule(teamId, input);
    await fetchSchedules();
  }

  async function updateSchedule(scheduleId, input) {
    await schedulesApi.updateSchedule(teamId, scheduleId, input);
    await fetchSchedules();
  }

  async function deleteSchedule(scheduleId) {
    await schedulesApi.deleteSchedule(teamId, scheduleId);
    await fetchSchedules();
  }

  return { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule };
}
