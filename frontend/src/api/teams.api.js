import { apiClient } from './client';

export function listMyTeams() {
  return apiClient.get('/teams');
}

export function createTeam(name) {
  return apiClient.post('/teams', { name });
}

export function joinTeam(teamId, inviteCode) {
  return apiClient.post(`/teams/${teamId}/members`, { invite_code: inviteCode });
}

export function listTeamMembers(teamId) {
  return apiClient.get(`/teams/${teamId}/members`);
}
