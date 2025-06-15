import { supabase } from '@/integrations/supabase/client';

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip_address?: string | null;
  is_active: boolean;
}

export class SessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly COOKIE_NAME = 'restay_session';
  private static readonly MAX_RETRIES = 3;

  // Generate a secure session token
  private static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get client info for session tracking
  private static getClientInfo() {
    return {
      user_agent: navigator.userAgent,
      ip_address: null
    };
  }

  // Retry wrapper for database operations
  private static async retryOperation<T>(
    operation: () => Promise<T>, 
    operationName: string
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`SessionService: ${operationName} attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          console.error(`SessionService: ${operationName} failed after ${this.MAX_RETRIES} attempts`);
          return null;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return null;
  }

  // Create a new session with retry logic
  static async createSession(userId: string): Promise<Session | null> {
    return this.retryOperation(async () => {
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();
      const clientInfo = this.getClientInfo();

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          expires_at: expiresAt,
          user_agent: clientInfo.user_agent,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store session token in secure cookie
      this.setSessionCookie(sessionToken, expiresAt);
      
      console.log('SessionService: Session created successfully:', data.id);
      return {
        ...data,
        ip_address: data.ip_address as string | null
      };
    }, 'createSession');
  }

  // Validate and refresh session with retry logic
  static async validateSession(): Promise<Session | null> {
    return this.retryOperation(async () => {
      const sessionToken = this.getSessionCookie();
      if (!sessionToken) {
        return null;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        // Invalid or expired session
        this.clearSessionCookie();
        return null;
      }

      // Extend session if it's valid
      await this.extendSession(data.id);
      return {
        ...data,
        ip_address: data.ip_address as string | null
      };
    }, 'validateSession');
  }

  // Extend session expiration with retry logic
  static async extendSession(sessionId: string): Promise<void> {
    await this.retryOperation(async () => {
      const newExpiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      // Update cookie expiration
      const sessionToken = this.getSessionCookie();
      if (sessionToken) {
        this.setSessionCookie(sessionToken, newExpiresAt);
      }
      
      return true;
    }, 'extendSession');
  }

  // Invalidate session with retry logic
  static async invalidateSession(sessionToken?: string): Promise<void> {
    await this.retryOperation(async () => {
      const token = sessionToken || this.getSessionCookie();
      if (!token) return true;

      const { error } = await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('session_token', token);

      if (error) {
        throw error;
      }

      this.clearSessionCookie();
      console.log('SessionService: Session invalidated');
      return true;
    }, 'invalidateSession');
  }

  // Get all active sessions for a user
  static async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return (data || []).map(session => ({
        ...session,
        ip_address: session.ip_address as string | null
      }));
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  }

  // Invalidate all sessions for a user (useful for logout from all devices)
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      this.clearSessionCookie();
      console.log('All user sessions invalidated');
    } catch (error) {
      console.error('Error invalidating all user sessions:', error);
    }
  }

  // Cookie management methods
  private static setSessionCookie(token: string, expiresAt: string): void {
    try {
      const expires = new Date(expiresAt);
      document.cookie = `${this.COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
    } catch (error) {
      console.error('SessionService: Failed to set session cookie:', error);
    }
  }

  private static getSessionCookie(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.COOKIE_NAME) {
          return value;
        }
      }
    } catch (error) {
      console.error('SessionService: Failed to get session cookie:', error);
    }
    return null;
  }

  private static clearSessionCookie(): void {
    try {
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (error) {
      console.error('SessionService: Failed to clear session cookie:', error);
    }
  }

  // Clean up expired sessions (can be called periodically)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_expired_sessions');
      if (error) {
        console.error('Error cleaning up expired sessions:', error);
      } else {
        console.log('Expired sessions cleaned up');
      }
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error);
    }
  }
}
