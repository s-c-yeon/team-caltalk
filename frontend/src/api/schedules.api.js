import { apiClient } from './client';

export function getSchedules(teamId, view, date) {
  const params = new URLSearchParams({ view, date });
  return apiClient.get(`/teams/${teamId}/schedules?${params.toString()}`);
}

export function createSchedule(teamId, input) {
  return apiClient.post(`/teams/${teamId}/schedules`, input);
}

export function updateSchedule(teamId, scheduleId, input) {
  return apiClient.patch(`/teams/${teamId}/schedules/${scheduleId}`, input);
}

export function deleteSchedule(teamId, scheduleId) {
  return apiClient.delete(`/teams/${teamId}/schedules/${scheduleId}`);
}
