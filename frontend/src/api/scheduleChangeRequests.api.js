import { apiClient } from './client';

export function listChangeRequests(teamId) {
  return apiClient.get(`/teams/${teamId}/schedule-change-requests`);
}
