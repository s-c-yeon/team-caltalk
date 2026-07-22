import { createContext, useEffect, useState } from 'react';
import { setToken } from '../api/client';

const USER_STORAGE_KEY = 'team-caltalk:user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  function signIn(token, signedInUser) {
    setToken(token);
    setUser(signedInUser);
  }

  function signOut() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}
