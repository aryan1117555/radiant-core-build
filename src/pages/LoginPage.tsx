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
import { EyeIcon, EyeOffIcon, UserIcon, AlertCircleIcon, Waves, Snowflake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const {
    user,
    signIn,
    loading
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log('Login attempt with:', {
      email: data.email,
      passwordLength: data.password.length
    });
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

  const quickLogin = async (email: string, password: string = 'password') => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await signIn(email, password);
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
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400" />
          <span className="text-cyan-300 font-medium">Loading...</span>
        </div>
      </div>;
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 text-cyan-400 animate-pulse">
          <Snowflake size={24} />
        </div>
        <div className="absolute top-40 right-32 text-blue-300 animate-bounce">
          <Waves size={32} />
        </div>
        <div className="absolute bottom-32 left-40 text-slate-400 animate-pulse">
          <Snowflake size={20} />
        </div>
        <div className="absolute bottom-20 right-20 text-cyan-300 animate-bounce">
          <Waves size={28} />
        </div>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>

      <div className="w-full max-w-md z-10">
        <Card className="border-slate-700 shadow-2xl bg-slate-800/90 backdrop-blur-md border-2">
          <CardHeader className="space-y-1 text-center relative">
            {/* Creative header with geometric shapes */}
            <div className="flex justify-center mb-4 relative">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-300 rounded-full animate-ping"></div>
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter your credentials to access the dashboard
            </CardDescription>

            {/* Decorative line */}
            <div className="flex items-center justify-center pt-2">
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loginError && (
              <Alert variant="destructive" className="mb-4 border-red-400/50 bg-red-900/20 text-red-300">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {loginError}
                </AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField 
                  control={form.control} 
                  name="email" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            placeholder="Enter your email" 
                            {...field} 
                            className="pl-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-300" 
                          />
                          <UserIcon className="absolute left-4 top-3 h-4 w-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} 
                />
                
                <FormField 
                  control={form.control} 
                  name="password" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            {...field} 
                            className="pr-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-300" 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-slate-600/50 transition-colors"
                          >
                            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </Button>
                          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} 
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group" 
                  disabled={isSubmitting}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative">
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
