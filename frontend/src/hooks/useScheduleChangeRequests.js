import { useCallback, useEffect, useState } from 'react';
import * as scheduleChangeRequestsApi from '../api/scheduleChangeRequests.api';

export function useScheduleChangeRequests(teamId) {
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChangeRequests = useCallback(() => {
    if (!teamId) {
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    return scheduleChangeRequestsApi
      .listChangeRequests(teamId)
      .then((data) => setChangeRequests(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  useEffect(() => {
    fetchChangeRequests();
  }, [fetchChangeRequests]);

  return { changeRequests, loading, error, refetch: fetchChangeRequests };
}
