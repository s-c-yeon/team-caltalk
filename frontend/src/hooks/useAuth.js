import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as authApi from '../api/auth.api';

export function useAuth() {
  const { user, signIn, signOut } = useContext(AuthContext);

  async function login(email, password) {
    const result = await authApi.login(email, password);
    signIn(result.token, result.user);
    return result.user;
  }

  async function signup(email, password) {
    return authApi.signup(email, password);
  }

  return { user, isAuthenticated: Boolean(user), login, signup, logout: signOut };
}
