
import React from 'react';
import { useOptimizedApi } from '@/services/optimizedApiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';

const ApiLoadMonitor: React.FC = () => {
  const { 
    cacheStats, 
    queueLength, 
    isProcessing, 
    remainingRequests, 
    resetTime,
    clearCache 
  } = useOptimizedApi();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getResetCountdown = () => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    return Math.ceil(remaining / 1000);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          API Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate Limiting */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Requests Remaining</span>
            <span>{remainingRequests}/4</span>
          </div>
          <Progress value={(remainingRequests / 4) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Resets in {getResetCountdown()}s
          </p>
        </div>

        {/* Queue Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Queue Length</span>
          <Badge variant={queueLength > 0 ? "destructive" : "secondary"}>
            {queueLength}
          </Badge>
        </div>

        {/* Processing Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Status</span>
          <Badge variant={isProcessing ? "default" : "secondary"}>
            {isProcessing ? "Processing" : "Idle"}
          </Badge>
        </div>

        {/* Cache Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Cache Entries</span>
            <span>{cacheStats.size}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cache Size</span>
            <span>{Math.round(cacheStats.totalSize / 1024)}KB</span>
          </div>
          {cacheStats.oldestEntry > 0 && (
            <div className="text-xs text-muted-foreground">
              Oldest: {formatTime(cacheStats.oldestEntry)}
            </div>
          )}
        </div>

        {/* Clear Cache Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => clearCache()}
          className="w-full"
          disabled={cacheStats.size === 0}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Clear Cache
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApiLoadMonitor;
