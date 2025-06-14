
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSessionManager } from '@/hooks/useSessionManager';
import { formatDistanceToNow } from 'date-fns';
import { MonitorIcon, SmartphoneIcon, TabletIcon, LogOutIcon, ShieldIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SessionManager: React.FC = () => {
  const {
    currentSession,
    userSessions,
    isValidating,
    invalidateSession,
    invalidateAllSessions
  } = useSessionManager();
  const { toast } = useToast();

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <MonitorIcon className="h-4 w-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <SmartphoneIcon className="h-4 w-4" />;
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return <TabletIcon className="h-4 w-4" />;
    }
    return <MonitorIcon className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const handleInvalidateSession = async (sessionToken: string) => {
    try {
      await invalidateSession(sessionToken);
      toast({
        title: "Session Terminated",
        description: "The session has been successfully terminated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInvalidateAllSessions = async () => {
    try {
      await invalidateAllSessions();
      toast({
        title: "All Sessions Terminated",
        description: "All active sessions have been terminated. You will need to log in again on other devices."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate all sessions. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions across different devices and browsers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValidating && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading sessions...</p>
            </div>
          )}

          {!isValidating && userSessions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active sessions found</p>
            </div>
          )}

          {!isValidating && userSessions.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Sessions ({userSessions.length})</h3>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleInvalidateAllSessions}
                  disabled={userSessions.length <= 1}
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Terminate All
                </Button>
              </div>

              <div className="space-y-3">
                {userSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.user_agent)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getBrowserName(session.user_agent)}</p>
                          {currentSession?.id === session.id && (
                            <Badge variant="secondary">Current Session</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(session.expires_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInvalidateSession(session.session_token)}
                      disabled={currentSession?.id === session.id}
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      Terminate
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
          <CardDescription>
            Information about session security and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• Sessions automatically expire after 24 hours of inactivity</p>
            <p>• You can have multiple active sessions across different devices</p>
            <p>• Terminating all sessions will log you out from all devices</p>
            <p>• Your current session cannot be terminated from this interface</p>
            <p>• Sessions are securely stored and encrypted</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManager;
