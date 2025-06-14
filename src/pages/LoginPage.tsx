
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EyeIcon, EyeOffIcon, UserIcon, AlertCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const { user, signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log('Login attempt with:', { email: data.email, passwordLength: data.password.length });
    setLoginError(null);
    setIsSubmitting(true);
    
    try {
      await signIn(data.email, data.password);
      console.log('Login successful');
      toast({
        title: "Login Successful",
        description: "Welcome to the dashboard"
      });
    } catch (error: any) {
      console.error('Login error details:', error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please confirm your email address before logging in.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Too many login attempts. Please wait a few minutes and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setLoginError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create demo user if they don't exist
  const createDemoUserIfNeeded = async (email: string, password: string) => {
    try {
      console.log('Creating demo user if needed:', email);
      
      // First try to sign in - if it works, user exists
      try {
        await signIn(email, password);
        console.log('Demo user already exists and login successful');
        return;
      } catch (loginError: any) {
        console.log('Login failed, will try to create user:', loginError.message);
        
        // Only create user if login failed due to invalid credentials
        if (loginError.message?.includes('Invalid login credentials')) {
          console.log('Creating demo user:', email);
          
          // Create user with admin privileges
          const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
              name: email.split('@')[0],
              role: email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : 'accountant'
            }
          });

          if (createError) {
            console.error('Error creating demo user:', createError);
            throw createError;
          }

          console.log('Demo user created successfully:', userData.user?.email);
          
          // Now try to sign in again
          await signIn(email, password);
        } else {
          // Re-throw the original login error if it's not about invalid credentials
          throw loginError;
        }
      }
    } catch (error) {
      console.error('Error in createDemoUserIfNeeded:', error);
      throw error;
    }
  };

  // Quick login function for demo users
  const quickLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      await createDemoUserIfNeeded(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome to the dashboard"
      });
    } catch (error: any) {
      console.error('Quick login error:', error);
      setLoginError(error.message || 'Quick login failed');
      toast({
        title: "Quick Login Failed",
        description: error.message || 'Quick login failed',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show minimal loading for faster perceived performance
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="https://restayindia.com/wp-content/uploads/2024/01/Restay_without-removebg.png" 
                alt="Logo" 
                className="h-16 object-contain" 
              />
            </div>
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {loginError}
                </AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your email"
                            {...field} 
                            className="pl-10" 
                          />
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field} 
                            className="pr-10" 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-0 h-full px-3"
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              <p className="mb-3 font-medium">Quick Login (Demo Accounts):</p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => quickLogin('admin@restay.com', 'password')}
                  disabled={isSubmitting}
                >
                  Login as Admin
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => quickLogin('manager@restay.com', 'password')}
                  disabled={isSubmitting}
                >
                  Login as Manager
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => quickLogin('accountant@restay.com', 'password')}
                  disabled={isSubmitting}
                >
                  Login as Accountant
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
