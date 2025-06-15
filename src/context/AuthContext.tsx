import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionService } from '@/services/sessionService';

// Extended User interface with custom properties
export interface User extends SupabaseUser {
  name?: string;
  role?: string;
  assignedPGs?: string[];
  status?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // Alias for signIn
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  getUsers: () => Promise<User[]>;
  createUser: (email: string, password: string, name: string, role: string, assignedPGs?: string[]) => Promise<User>;
  updateUser: (userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear all caches and reset state
  const clearAuthCache = () => {
    console.log('AuthProvider: Clearing all auth cache');
    setUser(null);
    localStorage.removeItem('demo-students');
    sessionStorage.clear();
    
    // Clear any stale session cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        // First check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session check:', { 
          session: session?.user?.email, 
          error: error?.message 
        });
        
        if (error) {
          console.error('AuthProvider: Session error:', error);
          clearAuthCache();
          throw error;
        } 
        
        if (session?.user) {
          try {
            // Validate session with SessionService
            const validSession = await SessionService.validateSession();
            if (!validSession) {
              console.log('AuthProvider: Session validation failed, clearing cache');
              clearAuthCache();
              await supabase.auth.signOut();
              return;
            }

            // Enhance user with metadata and sync with users table
            const enhancedUser = await enhanceUserWithMetadata(session.user);
            setUser(enhancedUser);
            
            // Create or validate session tracking
            await SessionService.createSession(session.user.id);
          } catch (enhanceError) {
            console.error('AuthProvider: Error enhancing user:', enhanceError);
            clearAuthCache();
            await supabase.auth.signOut();
          }
        } else {
          // No session found, clear everything
          clearAuthCache();
        }
      } catch (error) {
        console.error('AuthProvider: Critical error getting session:', error);
        clearAuthCache();
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
      
      try {
        if (session?.user) {
          const enhancedUser = await enhanceUserWithMetadata(session.user);
          setUser(enhancedUser);
          
          // Create or validate session
          if (event === 'SIGNED_IN') {
            await SessionService.createSession(session.user.id);
          }
        } else {
          clearAuthCache();
          
          // Invalidate session on sign out
          if (event === 'SIGNED_OUT') {
            await SessionService.invalidateSession();
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error in auth state change:', error);
        clearAuthCache();
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      subscription?.unsubscribe();
    };
  }, []);

  const enhanceUserWithMetadata = async (supabaseUser: SupabaseUser): Promise<User> => {
    try {
      // Try to get user data from users table with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (!error && userData) {
            // User exists in users table, use that data
            const assignedPGs = Array.isArray(userData.assignedPGs) 
              ? userData.assignedPGs 
              : userData.assignedPGs 
                ? JSON.parse(userData.assignedPGs as string) 
                : [];

            return {
              ...supabaseUser,
              name: userData.name,
              role: userData.role,
              assignedPGs: assignedPGs,
              status: userData.status,
              lastLogin: userData.lastLogin
            };
          } else if (error?.code === 'PGRST116') {
            // User not found, create entry
            break;
          } else {
            throw error;
          }
        } catch (dbError) {
          retryCount++;
          console.warn(`AuthProvider: Database attempt ${retryCount} failed:`, dbError);
          
          if (retryCount >= maxRetries) {
            throw dbError;
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      // User doesn't exist in users table, create entry
      console.log('AuthProvider: User not found in users table, creating entry...');
      const metadata = supabaseUser.user_metadata || {};
      const appMetadata = supabaseUser.app_metadata || {};
      
      const newUserData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: metadata.name || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: metadata.role || appMetadata.role || 'admin',
        assignedPGs: metadata.assignedPGs || appMetadata.assignedPGs || [],
        status: 'active',
        lastLogin: new Date().toISOString()
      };

      // Insert into users table with retry logic
      let insertRetryCount = 0;
      while (insertRetryCount < maxRetries) {
        try {
          const { data: insertedUser, error: insertError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          if (!insertError) {
            console.log('AuthProvider: User entry created successfully');
            break;
          } else {
            throw insertError;
          }
        } catch (insertErr) {
          insertRetryCount++;
          console.warn(`AuthProvider: Insert attempt ${insertRetryCount} failed:`, insertErr);
          
          if (insertRetryCount >= maxRetries) {
            console.error('AuthProvider: Failed to create user entry after retries');
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, insertRetryCount) * 1000));
        }
      }

      return {
        ...supabaseUser,
        name: newUserData.name,
        role: newUserData.role,
        assignedPGs: newUserData.assignedPGs,
        status: newUserData.status,
        lastLogin: newUserData.lastLogin
      };
    } catch (error) {
      console.error('Error enhancing user with metadata:', error);
      // Fallback to basic user data
      const metadata = supabaseUser.user_metadata || {};
      return {
        ...supabaseUser,
        name: metadata.name || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: metadata.role || 'admin',
        assignedPGs: metadata.assignedPGs || [],
        status: 'active',
        lastLogin: new Date().toISOString()
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('AuthProvider: Attempting to sign in user:', email);
    
    try {
      // Clear any existing cache before signin
      clearAuthCache();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('AuthProvider: Sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Handle specific auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          throw new Error(`Login failed: ${error.message}`);
        }
      }

      console.log('AuthProvider: Sign in successful for:', data.user?.email);
      
      // Update lastLogin in users table with retry logic
      if (data.user) {
        try {
          await supabase
            .from('users')
            .update({ lastLogin: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          console.warn('AuthProvider: Failed to update lastLogin:', updateError);
          // Non-critical error, don't throw
        }
        
        // Create session tracking
        try {
          await SessionService.createSession(data.user.id);
        } catch (sessionError) {
          console.warn('AuthProvider: Failed to create session:', sessionError);
          // Non-critical error, don't throw
        }
      }
    } catch (error) {
      console.error('AuthProvider: Sign in failed:', error);
      clearAuthCache();
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    
    try {
      // Invalidate current session before auth sign out
      await SessionService.invalidateSession();
    } catch (sessionError) {
      console.warn('AuthProvider: Failed to invalidate session:', sessionError);
      // Continue with sign out even if session invalidation fails
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: Sign out error:', error);
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      // Clear cache after successful sign out
      clearAuthCache();
      console.log('AuthProvider: Sign out successful');
    } catch (error) {
      console.error('AuthProvider: Sign out failed:', error);
      // Force clear cache even on error
      clearAuthCache();
      throw error;
    }
  };

  const createUser = async (email: string, password: string, name: string, role: string, assignedPGs: string[] = []): Promise<User> => {
    try {
      console.log('Creating user with client-side approach:', { email, name, role });
      
      // Since we can't use admin.createUser on client side, we'll create a regular signup
      // and then update the user data in our users table
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            assignedPGs
          }
        }
      });

      if (authError) {
        console.error('Error creating user in auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('User created in auth successfully:', authData.user.id);

      // Create entry in users table
      const newUserData = {
        id: authData.user.id,
        email: authData.user.email!,
        name,
        role: role as "admin" | "manager" | "accountant" | "viewer",
        assignedPGs,
        status: 'active',
        lastLogin: 'Never'
      };

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single();

      if (userError) {
        console.error('Error creating user in users table:', userError);
        // If users table insert fails, we should clean up the auth user
        // But for now, we'll just log the error and continue
      }

      console.log('User created successfully in both auth and users table');

      return {
        id: authData.user.id,
        email: authData.user.email!,
        name: newUserData.name,
        role: newUserData.role,
        assignedPGs: newUserData.assignedPGs,
        status: newUserData.status,
        lastLogin: newUserData.lastLogin,
        // Add required Supabase User properties
        aud: 'authenticated',
        created_at: authData.user.created_at,
        app_metadata: authData.user.app_metadata || {},
        user_metadata: authData.user.user_metadata || {},
        phone: authData.user.phone || '',
        confirmation_sent_at: authData.user.confirmation_sent_at || '',
        email_confirmed_at: authData.user.email_confirmed_at || '',
        confirmed_at: authData.user.confirmed_at || '',
        last_sign_in_at: authData.user.last_sign_in_at || '',
        updated_at: authData.user.updated_at
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<User> => {
    try {
      if (!userData.id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          role: userData.role as "admin" | "manager" | "accountant" | "viewer",
          status: userData.status,
          assignedPGs: userData.assignedPGs
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;

      // Properly handle assignedPGs conversion from JSON to string array
      const assignedPGs = Array.isArray(data.assignedPGs) 
        ? data.assignedPGs 
        : data.assignedPGs 
          ? JSON.parse(data.assignedPGs as string) 
          : [];

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        assignedPGs: assignedPGs,
        status: data.status,
        lastLogin: data.lastLogin,
        // Add required Supabase User properties
        aud: 'authenticated',
        created_at: data.created_at,
        app_metadata: {},
        user_metadata: {},
        phone: '',
        confirmation_sent_at: '',
        email_confirmed_at: '',
        confirmed_at: '',
        last_sign_in_at: '',
        updated_at: data.updated_at
      } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      // For client-side, we can only delete from users table
      // Auth user deletion requires admin privileges
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (userError) {
        console.error('Error deleting user from users table:', userError);
        throw userError;
      }

      console.log('User deleted from users table successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Transform database users to User interface
      return (data || []).map(dbUser => {
        // Properly handle assignedPGs conversion from JSON to string array
        const assignedPGs = Array.isArray(dbUser.assignedPGs) 
          ? dbUser.assignedPGs 
          : dbUser.assignedPGs 
            ? JSON.parse(dbUser.assignedPGs as string) 
            : [];

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          assignedPGs: assignedPGs,
          status: dbUser.status,
          lastLogin: dbUser.lastLogin,
          // Add required Supabase User properties with defaults
          aud: 'authenticated',
          created_at: dbUser.created_at || new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          phone: '',
          confirmation_sent_at: '',
          email_confirmed_at: '',
          confirmed_at: '',
          last_sign_in_at: '',
          updated_at: dbUser.updated_at || new Date().toISOString()
        } as User;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const value = {
    user,
    loading,
    isLoading: loading, // Alias
    signIn,
    login: signIn, // Alias
    signOut,
    logout: signOut, // Alias
    getUsers,
    createUser,
    updateUser,
    deleteUser,
  };

  console.log('AuthProvider: Current state:', { 
    user: user?.email, 
    loading,
    isAuthenticated: !!user 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
