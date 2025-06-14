
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
          // Enhance user with metadata
          const enhancedUser = await enhanceUserWithMetadata(session.user);
          setUser(enhancedUser);
        } else {
          setUser(null);
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
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      subscription?.unsubscribe();
    };
  }, []);

  const enhanceUserWithMetadata = async (supabaseUser: SupabaseUser): Promise<User> => {
    // Get user metadata from user_metadata or app_metadata
    const metadata = supabaseUser.user_metadata || {};
    const appMetadata = supabaseUser.app_metadata || {};
    
    return {
      ...supabaseUser,
      name: metadata.name || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
      role: metadata.role || appMetadata.role || 'admin', // Default to admin for now
      assignedPGs: metadata.assignedPGs || appMetadata.assignedPGs || [],
      status: 'active',
      lastLogin: new Date().toISOString()
    };
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('AuthProvider: Sign in error:', error);
      throw error;
    }

    console.log('AuthProvider: Sign in successful:', data.user?.email);
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthProvider: Sign out error:', error);
      throw error;
    }
    console.log('AuthProvider: Sign out successful');
  };

  // User management functions with proper signatures
  const getUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Transform database users to User interface
      return (data || []).map(dbUser => ({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        assignedPGs: Array.isArray(dbUser.assignedPGs) ? dbUser.assignedPGs : [],
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
      } as User));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const createUser = async (email: string, password: string, name: string, role: string, assignedPGs: string[] = []): Promise<User> => {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role, assignedPGs }
      });

      if (authError) throw authError;

      // Create user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          role,
          assignedPGs,
          status: 'active',
          lastLogin: 'Never'
        }])
        .select()
        .single();

      if (userError) throw userError;

      return {
        ...authData.user,
        name: userData.name,
        role: userData.role,
        assignedPGs: userData.assignedPGs,
        status: userData.status,
        lastLogin: userData.lastLogin
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
          role: userData.role,
          status: userData.status,
          assignedPGs: userData.assignedPGs
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        assignedPGs: data.assignedPGs,
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
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
