import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { clearSession, readSession, saveSession } from './session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const authenticate = useCallback(async (mode, username, password) => {
    const path = mode === 'register' ? '/register' : '/login';
    const { data } = await api.post(path, { username, password });
    const next = { token: data.token, user: data.user };
    saveSession(next);
    setSession(next);
  }, []);

  // Token kedaluwarsa atau ditolak server: keluar otomatis dan kembali ke halaman masuk.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err.config?.url || '';
        if (err.response?.status === 401 && url !== '/login' && url !== '/register') signOut();
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [signOut]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, isAuthed: Boolean(session), authenticate, signOut }),
    [session, authenticate, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
