
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemSettings from '@/components/SystemSettings';
import NotificationSettings from '@/components/NotificationSettings';
import BackupRecovery from '@/components/BackupRecovery';
import SessionManager from '@/components/SessionManager';
import { useAuth } from '@/context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your system preferences and configurations</p>
      </div>

      <Tabs defaultValue="system" className="w-full space-y-4 sm:space-y-6">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger value="system" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">System</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Notifications</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Sessions</TabsTrigger>
          <TabsTrigger value="backup" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-4 sm:mt-6">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 sm:mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4 sm:mt-6">
          <SessionManager />
        </TabsContent>

        <TabsContent value="backup" className="mt-4 sm:mt-6">
          <BackupRecovery />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
