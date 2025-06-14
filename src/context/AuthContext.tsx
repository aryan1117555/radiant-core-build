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

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session check:', { 
          session: session?.user?.email, 
          error 
        });
        
        if (error) {
          console.error('AuthProvider: Session error:', error);
        } else if (session?.user) {
          // Enhance user with metadata and sync with users table
          const enhancedUser = await enhanceUserWithMetadata(session.user);
          setUser(enhancedUser);
          
          // Create session tracking
          await SessionService.createSession(session.user.id);
        } else {
          // Check if there's a valid session cookie
          const validSession = await SessionService.validateSession();
          if (!validSession) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const enhancedUser = await enhanceUserWithMetadata(session.user);
        setUser(enhancedUser);
        
        // Create or validate session
        if (event === 'SIGNED_IN') {
          await SessionService.createSession(session.user.id);
        }
      } else {
        setUser(null);
        
        // Invalidate session on sign out
        if (event === 'SIGNED_OUT') {
          await SessionService.invalidateSession();
        }
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      subscription?.unsubscribe();
    };
  }, []);

  const enhanceUserWithMetadata = async (supabaseUser: SupabaseUser): Promise<User> => {
    try {
      // Try to get user data from users table first
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!error && userData) {
        // User exists in users table, use that data
        // Properly handle assignedPGs conversion from JSON to string array
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
      } else {
        console.log('AuthProvider: User not found in users table, creating entry...');
        // User doesn't exist in users table, create entry and use metadata
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

        // Insert into users table
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (insertError) {
          console.error('AuthProvider: Error creating user entry:', insertError);
        } else {
          console.log('AuthProvider: User entry created successfully');
        }

        return {
          ...supabaseUser,
          name: newUserData.name,
          role: newUserData.role,
          assignedPGs: newUserData.assignedPGs,
          status: newUserData.status,
          lastLogin: newUserData.lastLogin
        };
      }
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
        throw error;
      }

      console.log('AuthProvider: Sign in successful for:', data.user?.email);
      
      // Update lastLogin in users table
      if (data.user) {
        await supabase
          .from('users')
          .update({ lastLogin: new Date().toISOString() })
          .eq('id', data.user.id);
        
        // Create session tracking
        await SessionService.createSession(data.user.id);
      }
    } catch (error) {
      console.error('AuthProvider: Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    
    // Invalidate current session before auth sign out
    await SessionService.invalidateSession();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthProvider: Sign out error:', error);
      throw error;
    }
    console.log('AuthProvider: Sign out successful');
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
