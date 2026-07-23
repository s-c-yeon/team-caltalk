import { apiClient } from './client';

export function getSchedules(teamId, view, date) {
  const params = new URLSearchParams({ view, date });
  return apiClient.get(`/teams/${teamId}/schedules?${params.toString()}`);
}
