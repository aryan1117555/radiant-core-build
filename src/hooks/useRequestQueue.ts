
import { useState, useCallback, useRef } from 'react';

interface QueuedRequest<T> {
  id: string;
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
}

export const useRequestQueue = (maxConcurrent: number = 2) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const queue = useRef<QueuedRequest<any>[]>([]);
  const activeRequests = useRef(new Set<string>());

  const processQueue = useCallback(async () => {
    if (isProcessing || activeRequests.current.size >= maxConcurrent) {
      return;
    }

    setIsProcessing(true);

    while (queue.current.length > 0 && activeRequests.current.size < maxConcurrent) {
      // Sort by priority (higher number = higher priority)
      queue.current.sort((a, b) => b.priority - a.priority);
      
      const request = queue.current.shift();
      if (!request) break;

      activeRequests.current.add(request.id);
      setQueueLength(queue.current.length);

      try {
        const result = await request.requestFn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        activeRequests.current.delete(request.id);
      }
    }

    setIsProcessing(false);

    // Continue processing if there are more requests
    if (queue.current.length > 0) {
      setTimeout(processQueue, 100);
    }
  }, [isProcessing, maxConcurrent]);

  const addToQueue = useCallback(<T>(
    requestFn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const id = `${Date.now()}-${Math.random()}`;
      
      queue.current.push({
        id,
        requestFn,
        resolve,
        reject,
        priority
      });
      
      setQueueLength(queue.current.length);
      processQueue();
    });
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    queue.current.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    queue.current = [];
    setQueueLength(0);
  }, []);

  return {
    addToQueue,
    clearQueue,
    queueLength,
    isProcessing,
    activeRequestsCount: activeRequests.current.size
  };
};
