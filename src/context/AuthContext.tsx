
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { ensureStringArray } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  createUser: (email: string, password: string, name: string, role: string, assignedPGs?: string[]) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Demo users for fallback authentication
const DEMO_USERS = [
  {
    id: 'demo-admin-1',
    name: 'Admin User',
    email: 'admin@restay.com',
    role: 'admin',
    password: 'password',
    status: 'active',
    lastLogin: new Date().toISOString(),
    assignedPGs: []
  },
  {
    id: 'demo-manager-1', 
    name: 'Manager User',
    email: 'manager@restay.com',
    role: 'manager',
    password: 'password',
    status: 'active',
    lastLogin: new Date().toISOString(),
    assignedPGs: ['Sunrise PG', 'Comfort Lodge']
  },
  {
    id: 'demo-accountant-1',
    name: 'Accountant User',
    email: 'accountant@restay.com',
    role: 'accountant',
    password: 'password',
    status: 'active',
    lastLogin: new Date().toISOString(),
    assignedPGs: []
  }
];

// Helper function to convert database user to User type
const convertDbUserToUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status || 'active',
    lastLogin: dbUser.lastLogin || 'Never',
    assignedPGs: ensureStringArray(dbUser.assignedPGs)
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        console.log('AuthContext: Checking existing session...');
        
        // First check if user is in localStorage (demo mode)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('AuthContext: Found saved user in localStorage:', userData);
          setUser(userData);
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('AuthContext: Found Supabase session');
          // Get user profile from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (userData && !error) {
            const convertedUser = convertDbUserToUser(userData);
            console.log('AuthContext: Setting user from database:', convertedUser);
            setUser(convertedUser);
            localStorage.setItem('currentUser', JSON.stringify(convertedUser));
          }
        } else {
          console.log('AuthContext: No existing session found');
        }
      } catch (error) {
        console.error('AuthContext: Error checking user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userData && !error) {
          const convertedUser = convertDbUserToUser(userData);
          setUser(convertedUser);
          localStorage.setItem('currentUser', JSON.stringify(convertedUser));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('currentUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting login for:', email);

      // First try demo users
      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      if (demoUser) {
        console.log('AuthContext: Demo user login successful');
        const { password: _, ...userWithoutPassword } = demoUser;
        const userData = userWithoutPassword as User;
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setIsLoading(false);
        return;
      }

      // Try to find user in our users table first (for users created through the app)
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser && !userCheckError) {
        // User exists in our table, try Supabase authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If email not confirmed, we can still log them in using our users table
          if (error.message.includes('Email not confirmed')) {
            console.log('AuthContext: Email not confirmed, logging in with stored user data');
            const convertedUser = convertDbUserToUser(existingUser);
            setUser(convertedUser);
            localStorage.setItem('currentUser', JSON.stringify(convertedUser));
            
            // Update last login time
            await supabase
              .from('users')
              .update({ lastLogin: new Date().toISOString() })
              .eq('id', existingUser.id);
            
            setIsLoading(false);
            return;
          }
          console.error('AuthContext: Supabase login error:', error);
          throw error;
        }

        if (data.user) {
          console.log('AuthContext: Supabase user login successful');
          const convertedUser = convertDbUserToUser(existingUser);
          setUser(convertedUser);
          localStorage.setItem('currentUser', JSON.stringify(convertedUser));

          // Update last login time
          await supabase
            .from('users')
            .update({ lastLogin: new Date().toISOString() })
            .eq('id', existingUser.id);
        }
      } else {
        // User not found in our users table, throw error
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user');
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  const createUser = async (email: string, password: string, name: string, role: string, assignedPGs: string[] = []): Promise<void> => {
    try {
      console.log('AuthContext: Creating user:', { email, name, role, assignedPGs });

      // For admin role, don't assign specific PGs as they have access to all
      const finalAssignedPGs = role === 'admin' ? [] : assignedPGs;

      // Create Supabase auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name,
            role,
            email_confirm: true // Skip email confirmation
          }
        }
      });

      if (authError) {
        console.error('AuthContext: Auth user creation error:', authError);
        throw authError;
      }

      if (authData.user) {
        // Create the user profile in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            name,
            email,
            role,
            status: 'active',
            lastLogin: 'Never',
            assignedPGs: finalAssignedPGs
          }])
          .select()
          .single();

        if (userError) {
          console.error('AuthContext: User profile creation error:', userError);
          throw userError;
        }

        console.log('AuthContext: User created successfully:', userData);
      }
    } catch (error) {
      console.error('AuthContext: Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userData: User): Promise<void> => {
    try {
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

      if (error) {
        console.error('AuthContext: Error updating user:', error);
        throw error;
      }

      // Update current user if it's the same user
      if (user && user.id === userData.id) {
        const updatedUser = convertDbUserToUser(data);
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('AuthContext: Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Delete from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (userError) {
        console.error('AuthContext: Error deleting user profile:', userError);
        throw userError;
      }

      console.log('AuthContext: User deleted successfully');
    } catch (error) {
      console.error('AuthContext: Error deleting user:', error);
      throw error;
    }
  };

  const getUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('AuthContext: Error fetching users:', error);
        throw error;
      }

      console.log('AuthContext: Fetched users from database:', data);
      const convertedUsers = (data || []).map(convertDbUserToUser);
      
      // Add demo users to the list for admin view
      const demoUsersConverted: User[] = DEMO_USERS.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        status: u.status,
        lastLogin: u.lastLogin,
        assignedPGs: u.assignedPGs
      }));
      
      return [...convertedUsers, ...demoUsersConverted];
    } catch (error) {
      console.error('AuthContext: Error in getUsers:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    getUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
