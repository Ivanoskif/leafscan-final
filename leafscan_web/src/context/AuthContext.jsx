import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI, tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ls_token'));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('ls_user')); }
    catch { return null; }
  });

  const login = useCallback((tok, usr) => {
    localStorage.setItem('ls_token', tok);
    localStorage.setItem('ls_user',  JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  }, []);

  const logout = useCallback(async () => {
    // Пред да го исчистиме state-от, обиди се да го blacklist-наш refresh токенот.
    const refresh = tokenStorage.getRefresh();
    if (refresh) {
      try {
        await authAPI.logout(refresh);
      } catch {
        // Игнорирај backend грешки — секако ги бришеме токените локално.
      }
    }
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
