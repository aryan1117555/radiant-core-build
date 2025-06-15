import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DownloadIcon,
  DatabaseIcon,
  RefreshCwIcon,
  SaveIcon,
  UploadIcon,
  FileIcon,
  CalendarIcon,
  ClockIcon,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BackupData {
  id: string;
  name: string;
  date: Date;
  size: string;
  status: 'success' | 'failed';
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  user: string;
  path: string;
}

const BackupLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('backup');
  const [backupDate, setBackupDate] = useState<Date | undefined>(new Date());
  const [scheduledBackup, setScheduledBackup] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [backupTime, setBackupTime] = useState('02:00');
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  
  const { toast } = useToast();

  // Mock data for backups
  const backups: BackupData[] = [
    { id: '1', name: 'Daily Backup', date: new Date('2025-05-12 02:00'), size: '12.4 MB', status: 'success' },
    { id: '2', name: 'Weekly Backup', date: new Date('2025-05-10 03:00'), size: '30.1 MB', status: 'success' },
    { id: '3', name: 'Monthly Backup', date: new Date('2025-04-30 04:00'), size: '45.7 MB', status: 'success' },
    { id: '4', name: 'Manual Backup', date: new Date('2025-05-08 15:45'), size: '10.9 MB', status: 'failed' },
  ];

  // Mock data for logs
  const logs: LogEntry[] = [
    { id: '1', timestamp: new Date('2025-05-13 09:30'), level: 'info', message: 'User login successful', user: 'admin@restay.com', path: '/login' },
    { id: '2', timestamp: new Date('2025-05-13 09:25'), level: 'warning', message: 'Failed backup attempt', user: 'system', path: '/system/backup' },
    { id: '3', timestamp: new Date('2025-05-13 08:15'), level: 'error', message: 'Database connection failed', user: 'system', path: '/database/connect' },
    { id: '4', timestamp: new Date('2025-05-13 07:45'), level: 'info', message: 'New student added', user: 'manager@restay.com', path: '/students/add' },
    { id: '5', timestamp: new Date('2025-05-12 16:30'), level: 'info', message: 'Payment recorded', user: 'manager@restay.com', path: '/payments/add' },
  ];

  // Filter logs based on selected level and search query
  const filteredLogs = logs.filter(log => {
    if (selectedLogLevel !== 'all' && log.level !== selectedLogLevel) {
      return false;
    }
    if (logSearch && 
        !log.message.toLowerCase().includes(logSearch.toLowerCase()) &&
        !log.user.toLowerCase().includes(logSearch.toLowerCase()) &&
        !log.path.toLowerCase().includes(logSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleBackupNow = () => {
    setIsBackupInProgress(true);
    toast({
      title: "Backup Started",
      description: "System backup has been initiated. This may take a few minutes.",
    });
    
    // Simulate backup process
    setTimeout(() => {
      setIsBackupInProgress(false);
      toast({
        title: "Backup Completed",
        description: "System backup was completed successfully.",
      });
    }, 3000);
  };

  const handleRestoreBackup = (backupId: string) => {
    setIsRestoreInProgress(true);
    toast({
      title: "Restore Started",
      description: "System restore has been initiated. This may take a few minutes.",
    });
    
    // Simulate restore process
    setTimeout(() => {
      setIsRestoreInProgress(false);
      toast({
        title: "Restore Completed",
        description: "System restore was completed successfully.",
      });
    }, 3000);
  };

  const handleDownloadBackup = (backupId: string) => {
    toast({
      title: "Download Started",
      description: "Your backup file is being prepared for download.",
    });
  };

  const handleScheduleChange = (value: boolean) => {
    setScheduledBackup(value);
    if (value) {
      toast({
        title: "Backup Scheduled",
        description: `System will be backed up ${backupSchedule} at ${backupTime}.`,
      });
    } else {
      toast({
        title: "Schedule Disabled",
        description: "Scheduled backups have been disabled.",
      });
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Backup & Logs</h1>
      </div>

      <Tabs defaultValue="backup" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backup" className="text-xs sm:text-sm">Backup Management</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">System Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="backup" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Backup Options */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <Card className="col-span-1">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Backup Options</CardTitle>
                <CardDescription className="text-sm">Configure system backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <div className="font-medium text-sm sm:text-base">Manual Backup</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Create a backup of your system now</div>
                  <Button 
                    className="mt-2 w-full text-sm" 
                    onClick={handleBackupNow}
                    disabled={isBackupInProgress}
                  >
                    {isBackupInProgress ? (
                      <>
                        <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" /> 
                        Backing Up...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="mr-2 h-4 w-4" /> 
                        Backup Now
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="pt-3 sm:pt-4 border-t space-y-3">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">Scheduled Backups</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Automatically backup your system</div>
                    </div>
                    <Switch 
                      checked={scheduledBackup} 
                      onCheckedChange={handleScheduleChange} 
                      className="flex-shrink-0"
                    />
                  </div>
                  
                  {scheduledBackup && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium">Frequency</label>
                        <Select value={backupSchedule} onValueChange={setBackupSchedule}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium">Time</label>
                        <Input 
                          type="time" 
                          value={backupTime}
                          onChange={(e) => setBackupTime(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 sm:pt-4 border-t space-y-3">
                  <div className="font-medium text-sm sm:text-base">Upload Backup</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Import an existing backup file</div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input id="backup-file" type="file" className="text-sm flex-1" />
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <UploadIcon className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Upload</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 xl:col-span-2">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Backup History</CardTitle>
                <CardDescription className="text-sm">List of your recent system backups</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card View */}
                <div className="block lg:hidden px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div key={backup.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm truncate">{backup.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(backup.date, 'dd MMM yyyy, HH:mm')}
                            </p>
                          </div>
                          <Badge className={backup.status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                            {backup.status === 'success' ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Size: {backup.size}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id)}
                            className="flex-1 text-xs"
                          >
                            <DownloadIcon className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={backup.status !== 'success' || isRestoreInProgress}
                                className="flex-1 text-xs"
                              >
                                {isRestoreInProgress ? (
                                  <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <DatabaseIcon className="h-3 w-3 mr-1" />
                                )}
                                Restore
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-base">Restore Backup</DialogTitle>
                                <DialogDescription className="text-sm">
                                  Are you sure you want to restore the system to this backup point? This will overwrite all current data.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-3">
                                <div className="font-medium text-sm">Backup Details:</div>
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  <div>Name: {backup.name}</div>
                                  <div>Date: {format(backup.date, 'dd MMM yyyy, HH:mm')}</div>
                                  <div>Size: {backup.size}</div>
                                </div>
                              </div>
                              <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                                <AlertTitle className="text-sm">Warning!</AlertTitle>
                                <AlertDescription className="text-xs">
                                  This action cannot be undone. All data added after this backup will be lost.
                                </AlertDescription>
                              </Alert>
                              <DialogFooter className="mt-3 flex-col sm:flex-row gap-2">
                                <Button variant="outline" className="w-full sm:w-auto text-sm">Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRestoreBackup(backup.id)}
                                  disabled={isRestoreInProgress}
                                  className="w-full sm:w-auto text-sm"
                                >
                                  {isRestoreInProgress ? 'Restoring...' : 'Restore System'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">Backup Name</TableHead>
                          <TableHead className="text-sm">Date</TableHead>
                          <TableHead className="text-sm">Size</TableHead>
                          <TableHead className="text-sm">Status</TableHead>
                          <TableHead className="text-right text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                {backup.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{format(backup.date, 'dd MMM yyyy, HH:mm')}</TableCell>
                            <TableCell className="text-sm">{backup.size}</TableCell>
                            <TableCell>
                              <Badge className={backup.status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                                {backup.status === 'success' ? 'Success' : 'Failed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadBackup(backup.id)}
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      disabled={backup.status !== 'success' || isRestoreInProgress}
                                    >
                                      {isRestoreInProgress ? (
                                        <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <DatabaseIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Restore Backup</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to restore the system to this backup point? This will overwrite all current data.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <div className="font-medium">Backup Details:</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        <div>Name: {backup.name}</div>
                                        <div>Date: {format(backup.date, 'dd MMM yyyy, HH:mm')}</div>
                                        <div>Size: {backup.size}</div>
                                      </div>
                                    </div>
                                    <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                                      <AlertTitle>Warning!</AlertTitle>
                                      <AlertDescription>
                                        This action cannot be undone. All data added after this backup will be lost.
                                      </AlertDescription>
                                    </Alert>
                                    <DialogFooter className="mt-4">
                                      <Button variant="outline">Cancel</Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleRestoreBackup(backup.id)}
                                        disabled={isRestoreInProgress}
                                      >
                                        {isRestoreInProgress ? 'Restoring...' : 'Restore System'}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">System Logs</CardTitle>
              <CardDescription className="text-sm">View and analyze system activity logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                
                <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                  <SelectTrigger className="w-full sm:w-[180px] text-sm">
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[240px] justify-start text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>Filter by Date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={backupDate}
                      onSelect={setBackupDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </div>
              
              {/* Mobile Log Cards */}
              <div className="block lg:hidden space-y-3">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ClockIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {format(log.timestamp, 'dd MMM yyyy, HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-sm font-medium break-words">{log.message}</p>
                      </div>
                      {getLogLevelBadge(log.level)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>User: {log.user}</div>
                      <div className="font-mono break-all">Path: {log.path}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No log entries found matching your criteria
                  </div>
                )}
              </div>

              {/* Desktop Log Table */}
              <div className="hidden lg:block border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Timestamp</TableHead>
                      <TableHead className="text-sm">Level</TableHead>
                      <TableHead className="text-sm">Message</TableHead>
                      <TableHead className="text-sm">User</TableHead>
                      <TableHead className="text-sm">Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(log.timestamp, 'dd MMM yyyy, HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                        <TableCell className="text-sm">{log.user}</TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">{log.path}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No log entries found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupLogsPage;
