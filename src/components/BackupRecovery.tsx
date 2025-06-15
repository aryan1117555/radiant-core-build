
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { Database, Download, Upload, Calendar, FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Backup type definition
interface Backup {
  id: string;
  name: string;
  timestamp: Date;
  size: string;
  type: 'manual' | 'scheduled';
  status: 'completed' | 'failed';
}

const mockBackups: Backup[] = [
  {
    id: '1',
    name: 'Full System Backup',
    timestamp: new Date(),
    size: '28.5 MB',
    type: 'manual',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Daily Scheduled Backup',
    timestamp: subDays(new Date(), 1),
    size: '26.2 MB',
    type: 'scheduled',
    status: 'completed'
  },
  {
    id: '3',
    name: 'Daily Scheduled Backup',
    timestamp: subDays(new Date(), 2),
    size: '25.9 MB',
    type: 'scheduled',
    status: 'completed'
  },
  {
    id: '4',
    name: 'Manual Pre-Update Backup',
    timestamp: subDays(new Date(), 5),
    size: '24.1 MB',
    type: 'manual',
    status: 'completed'
  },
  {
    id: '5',
    name: 'Weekly Scheduled Backup',
    timestamp: subDays(new Date(), 7),
    size: '23.8 MB',
    type: 'scheduled',
    status: 'failed'
  },
];

const BackupRecovery = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isScheduledBackupEnabled, setIsScheduledBackupEnabled] = useState(true);
  
  // Trigger manual backup function
  const triggerManualBackup = () => {
    setIsBackupInProgress(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const newBackup: Backup = {
            id: Date.now().toString(),
            name: 'Manual Backup',
            timestamp: new Date(),
            size: '28.7 MB',
            type: 'manual',
            status: 'completed'
          };
          
          setBackups([newBackup, ...backups]);
          
          setTimeout(() => {
            setIsBackupInProgress(false);
            toast({
              title: "Backup Completed",
              description: "Your system backup has been created successfully.",
            });
          }, 500);
          
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  
  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
  };
  
  const confirmRestore = () => {
    if (!selectedBackup) return;
    
    setIsRestoring(true);
    
    setTimeout(() => {
      setIsRestoring(false);
      toast({
        title: "System Restored",
        description: `System has been restored to backup from ${format(selectedBackup.timestamp, 'dd MMM yyyy, HH:mm')}.`,
      });
    }, 3000);
  };
  
  const downloadBackup = (backup: Backup) => {
    toast({
      title: "Download Started",
      description: `Downloading backup from ${format(backup.timestamp, 'dd MMM yyyy')}.`,
    });
  };
  
  const deleteBackup = (id: string) => {
    setBackups(backups.filter(backup => backup.id !== id));
    toast({
      title: "Backup Deleted",
      description: "The selected backup has been deleted.",
    });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" /> 
            Backup & Recovery
          </CardTitle>
          <CardDescription className="text-sm">
            Create backups and restore your system when needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Manual Backup Section */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-start">
            <div className="space-y-2 flex-1">
              <h3 className="text-base sm:text-lg font-medium">Manual Backup</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create a full system backup including all PG data, students, and settings
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {isBackupInProgress ? (
                <div className="w-full lg:w-64 space-y-2">
                  <Progress value={backupProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    {backupProgress}% Complete
                  </p>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full lg:w-auto">
                      <Database className="mr-2 h-4 w-4" /> Create Backup
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create System Backup</DialogTitle>
                      <DialogDescription className="text-sm">
                        This will create a complete backup of your system data.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Backup Name</label>
                        <Input 
                          placeholder="Enter a name for this backup" 
                          defaultValue={`Manual Backup - ${format(new Date(), 'dd MMM yyyy')}`}
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Backup Description (Optional)</label>
                        <Input placeholder="Enter a description for this backup" className="text-sm" />
                      </div>
                      
                      <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-md">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm">
                          Backups include all system data. The process may take a few minutes to complete.
                        </p>
                      </div>
                    </div>
                    
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" type="button" className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button onClick={triggerManualBackup} className="w-full sm:w-auto">
                        Start Backup
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Scheduled Backup Section */}
          <div className="border-t pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
              <div className="space-y-2 flex-1">
                <h3 className="text-base sm:text-lg font-medium">Scheduled Backups</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Configure automatic backups on a regular schedule
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {isScheduledBackupEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch 
                  checked={isScheduledBackupEnabled} 
                  onCheckedChange={setIsScheduledBackupEnabled}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Frequency</label>
                <Select defaultValue="daily">
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Time</label>
                <Select defaultValue="midnight">
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midnight">12:00 AM (Midnight)</SelectItem>
                    <SelectItem value="early_morning">3:00 AM</SelectItem>
                    <SelectItem value="morning">6:00 AM</SelectItem>
                    <SelectItem value="noon">12:00 PM (Noon)</SelectItem>
                    <SelectItem value="evening">6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Keep Backups</label>
                <Select defaultValue="30">
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last 1 year</SelectItem>
                    <SelectItem value="forever">Keep all backups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              className="mt-4 w-full sm:w-auto" 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Schedule Updated",
                  description: "Your backup schedule has been updated successfully.",
                });
              }}
            >
              Save Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Backup History */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Backup History</CardTitle>
          <CardDescription className="text-sm">
            View and manage your previous system backups
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="block lg:hidden px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3">
              {backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No backups available. Create a backup to get started.
                </div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{backup.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(backup.timestamp, 'dd MMM yyyy, HH:mm')}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {backup.status === 'completed' ? 
                          <><CheckCircle2 className="h-3 w-3" /> Completed</> : 
                          <><AlertTriangle className="h-3 w-3" /> Failed</>}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Size: {backup.size}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        backup.type === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.type === 'manual' ? 'Manual' : 'Scheduled'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup)}
                        disabled={backup.status !== 'completed'}
                        className="flex-1 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(backup)}
                            disabled={backup.status !== 'completed'}
                            className="flex-1 text-xs text-amber-700 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">Restore System</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              This will restore your system to the state from {format(backup.timestamp, 'dd MMM yyyy, HH:mm')}.
                              All current data will be replaced. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel disabled={isRestoring} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={confirmRestore}
                              className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                              disabled={isRestoring}
                            >
                              {isRestoring ? "Restoring..." : "Restore System"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Name</TableHead>
                    <TableHead className="text-sm">Date</TableHead>
                    <TableHead className="text-sm">Size</TableHead>
                    <TableHead className="text-sm">Type</TableHead>
                    <TableHead className="text-sm">Status</TableHead>
                    <TableHead className="text-right text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No backups available. Create a backup to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(backup.timestamp, 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            backup.type === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {backup.type === 'manual' ? 'Manual' : 'Scheduled'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {backup.status === 'completed' ? 
                              <><CheckCircle2 className="h-3 w-3" /> Completed</> : 
                              <><AlertTriangle className="h-3 w-3" /> Failed</>}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => downloadBackup(backup)}
                              disabled={backup.status !== 'completed'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleRestore(backup)}
                                  disabled={backup.status !== 'completed'}
                                  className="text-amber-700 hover:text-amber-700 hover:bg-amber-50"
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restore System</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will restore your system to the state from {format(backup.timestamp, 'dd MMM yyyy, HH:mm')}.
                                    All current data will be replaced. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={confirmRestore}
                                    className="bg-amber-600 hover:bg-amber-700"
                                    disabled={isRestoring}
                                  >
                                    {isRestoring ? "Restoring..." : "Restore System"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deleteBackup(backup.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Backup Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Upload Backup
          </CardTitle>
          <CardDescription className="text-sm">
            Import a previously downloaded backup file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 sm:p-8 text-center">
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">Upload a Backup File</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Drag and drop your backup file here, or click to browse
            </p>
            <Button variant="outline" className="w-full sm:w-auto">
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRecovery;
