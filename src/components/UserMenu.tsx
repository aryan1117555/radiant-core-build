
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { LogOutIcon, UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('UserMenu: Starting logout process...');
      
      // Show initial toast
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out."
      });

      // Sign out using the auth context
      await signOut();
      
      // Navigate to login page
      navigate('/login', { replace: true });
      
      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been signed out from all devices."
      });
      
      console.log('UserMenu: Logout successful');
    } catch (error) {
      console.error('UserMenu: Logout error:', error);
      
      // Show error toast
      toast({
        title: "Logout failed", 
        description: "There was an issue signing out. Please try again.",
        variant: "destructive"
      });
      
      // Force navigation to login even on error
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <div className="h-8 w-8 rounded-full bg-restay flex items-center justify-center text-white">
            <span className="text-xs font-medium">
              {user.name?.split(' ').map(n => n[0]).join('') || 'A'}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || 'Admin User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOutIcon className={`mr-2 h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
