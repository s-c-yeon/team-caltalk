import { apiClient } from './client';

export function getChatMessages(teamId, date) {
  const params = new URLSearchParams({ date });
  return apiClient.get(`/teams/${teamId}/chat-messages?${params.toString()}`);
}

export function sendChatMessage(teamId, input) {
  return apiClient.post(`/teams/${teamId}/chat-messages`, input);
}
