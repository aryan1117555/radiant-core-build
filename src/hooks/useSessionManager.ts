
import { useState, useEffect, useCallback } from 'react';
import { SessionService, Session } from '@/services/sessionService';
import { useAuth } from '@/context/AuthContext';

export const useSessionManager = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session on first load
  const initializeSession = useCallback(async () => {
    if (!user || isInitialized) return;
    
    console.log('useSessionManager: Initializing session for user:', user.id);
    setIsValidating(true);
    
    try {
      const session = await SessionService.initializeSession();
      setCurrentSession(session);
      setIsInitialized(true);
      
      if (session) {
        await loadUserSessions();
      }
    } catch (error) {
      console.error('useSessionManager: Error initializing session:', error);
      setCurrentSession(null);
    } finally {
      setIsValidating(false);
    }
  }, [user, isInitialized]);

  // Validate current session
  const validateCurrentSession = useCallback(async () => {
    if (!user || !isInitialized) return;
    
    setIsValidating(true);
    try {
      const session = await SessionService.validateSession();
      setCurrentSession(session);
      
      if (!session) {
        console.log('useSessionManager: Session validation failed, user may need to re-authenticate');
      }
    } catch (error) {
      console.error('useSessionManager: Error validating session:', error);
      setCurrentSession(null);
    } finally {
      setIsValidating(false);
    }
  }, [user, isInitialized]);

  // Load user sessions
  const loadUserSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const sessions = await SessionService.getUserSessions(user.id);
      setUserSessions(sessions);
    } catch (error) {
      console.error('useSessionManager: Error loading user sessions:', error);
      setUserSessions([]);
    }
  }, [user]);

  // Create new session on login
  const createSession = useCallback(async () => {
    if (!user) return null;
    
    try {
      const session = await SessionService.createSession(user.id);
      setCurrentSession(session);
      setIsInitialized(true);
      await loadUserSessions();
      return session;
    } catch (error) {
      console.error('useSessionManager: Error creating session:', error);
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
      console.error('useSessionManager: Error invalidating session:', error);
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
      console.error('useSessionManager: Error invalidating all sessions:', error);
    }
  }, [user]);

  // Invalidate specific session
  const invalidateSession = useCallback(async (sessionToken: string) => {
    try {
      await SessionService.invalidateSession(sessionToken);
      await loadUserSessions();
    } catch (error) {
      console.error('useSessionManager: Error invalidating specific session:', error);
    }
  }, [loadUserSessions]);

  // Initialize session when user changes
  useEffect(() => {
    if (user) {
      initializeSession();
    } else {
      setCurrentSession(null);
      setUserSessions([]);
      setIsInitialized(false);
    }
  }, [user, initializeSession]);

  // Set up periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!user || !isInitialized) return;

    const interval = setInterval(() => {
      validateCurrentSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, isInitialized, validateCurrentSession]);

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
    isInitialized,
    createSession,
    validateCurrentSession,
    invalidateCurrentSession,
    invalidateAllSessions,
    invalidateSession,
    loadUserSessions
  };
};
