import { useState, useEffect } from 'react';
import { getUserFromSession, logoutUser } from '../api';
import { useRouter } from '@tanstack/react-router';

export function getSessionId() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sessionId');
  }
  return null;
}

export function setSessionId(id: string) {
  localStorage.setItem('sessionId', id);
}

export function clearSessionId() {
  localStorage.removeItem('sessionId');
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const sessionId = getSessionId();
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const userData = await (getUserFromSession as any)({ data: sessionId });
        setUser(userData);
      } catch (e) {
        clearSessionId();
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const logout = async () => {
    const sessionId = getSessionId();
    if (sessionId) {
      (logoutUser as any)({ data: sessionId });
    }
    localStorage.removeItem('sessionId');
    setUser(null);
    router.navigate({ to: '/login' });
  };

  return { user, loading, logout, setUser };
}
