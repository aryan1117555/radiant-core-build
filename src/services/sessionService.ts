
import { supabase } from '@/integrations/supabase/client';

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
}

export class SessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly COOKIE_NAME = 'restay_session';

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
      // Note: IP address will be handled server-side in production
      ip_address: null
    };
  }

  // Create a new session
  static async createSession(userId: string): Promise<Session | null> {
    try {
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
        console.error('Error creating session:', error);
        return null;
      }

      // Store session token in secure cookie
      this.setSessionCookie(sessionToken, expiresAt);
      
      console.log('Session created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  // Validate and refresh session
  static async validateSession(): Promise<Session | null> {
    try {
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
      return data;
    } catch (error) {
      console.error('Error validating session:', error);
      this.clearSessionCookie();
      return null;
    }
  }

  // Extend session expiration
  static async extendSession(sessionId: string): Promise<void> {
    try {
      const newExpiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();
      
      await supabase
        .from('sessions')
        .update({ 
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Update cookie expiration
      const sessionToken = this.getSessionCookie();
      if (sessionToken) {
        this.setSessionCookie(sessionToken, newExpiresAt);
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }

  // Invalidate session
  static async invalidateSession(sessionToken?: string): Promise<void> {
    try {
      const token = sessionToken || this.getSessionCookie();
      if (!token) return;

      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('session_token', token);

      this.clearSessionCookie();
      console.log('Session invalidated');
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
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

      return data || [];
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
    const expires = new Date(expiresAt);
    document.cookie = `${this.COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  }

  private static getSessionCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.COOKIE_NAME) {
        return value;
      }
    }
    return null;
  }

  private static clearSessionCookie(): void {
    document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
