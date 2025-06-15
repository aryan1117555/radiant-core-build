
import React from 'react';
import AppSidebar from './AppSidebar';
import UserMenu from './UserMenu';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isMobile ? 'ml-[70px]' : 'ml-[70px] lg:ml-[280px]'
      } w-full`}>
        {/* Professional header */}
        <header className="h-16 border-b border-border/20 flex items-center justify-between px-4 lg:px-8 w-full glass-effect">
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-foreground">ReStay Management</h1>
            </div>
          </div>
          <UserMenu />
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto w-full bg-gradient-to-br from-background via-background/95 to-background">
          <div className="w-full max-w-none p-4 lg:p-8 min-h-full">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
