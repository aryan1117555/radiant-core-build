
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, CreditCardIcon, BarChart2Icon, SettingsIcon, LogOutIcon, BuildingIcon, DoorOpenIcon, UserIcon, DatabaseIcon, MenuIcon, ChevronLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [pathname, isMobile]);

  // Define menu items for the sidebar
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboardIcon,
      description: 'Overview of key metrics',
      roles: ['admin', 'manager', 'accountant', 'viewer']
    },
    {
      name: 'Students',
      href: '/students',
      icon: UsersIcon,
      description: 'Manage student records',
      roles: ['admin', 'manager']
    },
    {
      name: 'PG Management',
      href: '/pg-management',
      icon: BuildingIcon,
      description: 'Manage PG properties',
      roles: ['admin']
    },
    {
      name: 'Room Management',
      href: '/room-management',
      icon: DoorOpenIcon,
      description: 'Track rooms and occupancy',
      roles: ['admin', 'manager']
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCardIcon,
      description: 'Track financial transactions',
      roles: ['admin', 'manager', 'accountant']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart2Icon,
      description: 'Analytics and reporting',
      roles: ['admin']
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserIcon,
      description: 'User account management',
      roles: ['admin']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
      description: 'System configuration',
      roles: ['admin']
    },
    {
      name: 'Backup & Logs',
      href: '/backup-logs',
      icon: DatabaseIcon,
      description: 'Data backup and system logs',
      roles: ['admin']
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    return user?.role && item.roles.includes(user.role);
  });

  // Handle menu item click on mobile to close sidebar
  const handleMenuItemClick = () => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // Enhanced logout with proper error handling
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('AppSidebar: Starting logout process...');
      
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
      
      console.log('AppSidebar: Logout successful');
    } catch (error) {
      console.error('AppSidebar: Logout error:', error);
      
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

  return (
    <aside className={cn(
      "h-screen fixed left-0 top-0 z-40 bg-sidebar flex flex-col transition-all duration-300 ease-in-out shadow-lg",
      isCollapsed ? "w-[70px]" : "w-[70px] lg:w-[280px]"
    )}>
      <div className="flex justify-between items-center h-16 px-3 border-b border-white/10">
        {!isCollapsed && !isMobile && (
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-bold text-white"></h1>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-white hover:bg-white/10 ml-auto lg:ml-0"
        >
          {isCollapsed ? <MenuIcon size={20} /> : <ChevronLeftIcon size={20} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => (
            <li key={item.name}>
              <Link 
                to={item.href} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-white hover:bg-white/10 transition-all duration-200 group",
                  pathname === item.href && "bg-white/20 shadow-sm",
                  isCollapsed && "justify-center px-2"
                )} 
                title={isCollapsed ? item.name : item.description} 
                onClick={handleMenuItemClick}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && !isMobile && (
                  <span className="font-medium text-sm truncate">{item.name}</span>
                )}
                {!isCollapsed && !isMobile && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-3 border-t border-white/10">
        {user && (
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-white flex-shrink-0">
              <span className="text-xs font-medium">
                {user.name?.split(' ').map(n => n[0]).join('') || 'A'}
              </span>
            </div>
            
            {!isCollapsed && !isMobile && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {user.name || 'Admin User'}
                </p>
                <p className="text-xs truncate text-zinc-300">
                  {user.email || 'admin@restay.com'}
                </p>
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mt-1",
                  user.role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' :
                  user.role === 'manager' ? 'bg-amber-500/20 text-amber-300' :
                  user.role === 'accountant' ? 'bg-green-500/20 text-green-300' :
                  user.role === 'viewer' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-blue-500/20 text-blue-300'
                )}>
                  {user.role || 'admin'}
                </span>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="h-8 w-8 text-white hover:bg-white/10 flex-shrink-0 disabled:opacity-50" 
              title="Logout"
            >
              <LogOutIcon className={cn("h-4 w-4", isLoggingOut && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
