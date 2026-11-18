const KEY = 'simple-notes-session';

export function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.token ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* penyimpanan browser tidak tersedia, sesi hanya hidup selama tab terbuka */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
