import { apiClient } from './client';

export function signup(email, password) {
  return apiClient.post('/auth/signup', { email, password });
}

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password });
}
