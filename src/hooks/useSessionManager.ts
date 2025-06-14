
import { useState, useEffect, useCallback } from 'react';
import { SessionService, Session } from '@/services/sessionService';
import { useAuth } from '@/context/AuthContext';

export const useSessionManager = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Validate current session
  const validateCurrentSession = useCallback(async () => {
    if (!user) return;
    
    setIsValidating(true);
    try {
      const session = await SessionService.validateSession();
      setCurrentSession(session);
    } catch (error) {
      console.error('Error validating session:', error);
      setCurrentSession(null);
    } finally {
      setIsValidating(false);
    }
  }, [user]);

  // Load user sessions
  const loadUserSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const sessions = await SessionService.getUserSessions(user.id);
      setUserSessions(sessions);
    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  }, [user]);

  // Create new session on login
  const createSession = useCallback(async () => {
    if (!user) return null;
    
    try {
      const session = await SessionService.createSession(user.id);
      setCurrentSession(session);
      await loadUserSessions();
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, [user, loadUserSessions]);

  // Invalidate current session
  const invalidateCurrentSession = useCallback(async () => {
    try {
      await SessionService.invalidateSession();
      setCurrentSession(null);
      await loadUserSessions();
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }, [loadUserSessions]);

  // Invalidate all user sessions
  const invalidateAllSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      await SessionService.invalidateAllUserSessions(user.id);
      setCurrentSession(null);
      setUserSessions([]);
    } catch (error) {
      console.error('Error invalidating all sessions:', error);
    }
  }, [user]);

  // Invalidate specific session
  const invalidateSession = useCallback(async (sessionToken: string) => {
    try {
      await SessionService.invalidateSession(sessionToken);
      await loadUserSessions();
    } catch (error) {
      console.error('Error invalidating specific session:', error);
    }
  }, [loadUserSessions]);

  // Auto-validate session on component mount and user change
  useEffect(() => {
    if (user) {
      validateCurrentSession();
      loadUserSessions();
    } else {
      setCurrentSession(null);
      setUserSessions([]);
    }
  }, [user, validateCurrentSession, loadUserSessions]);

  // Set up periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      validateCurrentSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, validateCurrentSession]);

  // Clean up expired sessions periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      SessionService.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return {
    currentSession,
    userSessions,
    isValidating,
    createSession,
    validateCurrentSession,
    invalidateCurrentSession,
    invalidateAllSessions,
    invalidateSession,
    loadUserSessions
  };
};
