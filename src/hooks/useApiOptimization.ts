
import { useState, useCallback, useRef, useMemo } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestQueue {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export const useApiOptimization = <T = any>(cacheTime: number = 5 * 60 * 1000) => {
  const cache = useRef(new Map<string, CacheEntry<T>>());
  const pendingRequests = useRef(new Map<string, Promise<T>>());
  const requestQueue = useRef(new Map<string, RequestQueue[]>());
  const lastRequestTime = useRef(new Map<string, number>());
  
  // Rate limiting: minimum time between requests
  const RATE_LIMIT_MS = 1000; // 1 second between requests for same endpoint

  const getCacheKey = useCallback((url: string, params?: any): string => {
    return `${url}${params ? JSON.stringify(params) : ''}`;
  }, []);

  const isRequestAllowed = useCallback((key: string): boolean => {
    const lastTime = lastRequestTime.current.get(key);
    if (!lastTime) return true;
    
    return Date.now() - lastTime >= RATE_LIMIT_MS;
  }, []);

  const getCachedData = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);

  const setCachedData = useCallback((key: string, data: T): void => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTime
    });
  }, [cacheTime]);

  const executeRequest = useCallback(async <R = T>(
    requestFn: () => Promise<R>,
    key: string
  ): Promise<R> => {
    try {
      const result = await requestFn();
      setCachedData(key, result as unknown as T);
      lastRequestTime.current.set(key, Date.now());
      
      // Resolve any queued requests with the same key
      const queued = requestQueue.current.get(key);
      if (queued) {
        queued.forEach(({ resolve }) => resolve(result));
        requestQueue.current.delete(key);
      }
      
      return result;
    } catch (error) {
      // Reject any queued requests
      const queued = requestQueue.current.get(key);
      if (queued) {
        queued.forEach(({ reject }) => reject(error));
        requestQueue.current.delete(key);
      }
      throw error;
    } finally {
      pendingRequests.current.delete(key);
    }
  }, [setCachedData]);

  const optimizedRequest = useCallback(async <R = T>(
    requestFn: () => Promise<R>,
    url: string,
    params?: any
  ): Promise<R> => {
    const key = getCacheKey(url, params);
    
    // Check cache first
    const cachedData = getCachedData(key);
    if (cachedData) {
      return cachedData as unknown as R;
    }
    
    // Check if there's already a pending request for this key
    const pendingRequest = pendingRequests.current.get(key);
    if (pendingRequest) {
      return pendingRequest as Promise<R>;
    }
    
    // Rate limiting check
    if (!isRequestAllowed(key)) {
      return new Promise<R>((resolve, reject) => {
        const queue = requestQueue.current.get(key) || [];
        queue.push({ resolve, reject });
        requestQueue.current.set(key, queue);
        
        // Schedule the request for later
        setTimeout(() => {
          if (!pendingRequests.current.has(key)) {
            const request = executeRequest(requestFn, key);
            pendingRequests.current.set(key, request as Promise<T>);
          }
        }, RATE_LIMIT_MS);
      });
    }
    
    // Execute the request
    const request = executeRequest(requestFn, key);
    pendingRequests.current.set(key, request as Promise<T>);
    
    return request as Promise<R>;
  }, [getCacheKey, getCachedData, isRequestAllowed, executeRequest]);

  const clearCache = useCallback((pattern?: string): void => {
    if (pattern) {
      const keys = Array.from(cache.current.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.current.delete(key);
        }
      });
    } else {
      cache.current.clear();
    }
  }, []);

  const cacheStats = useMemo(() => {
    const entries = Array.from(cache.current.entries());
    return {
      size: entries.length,
      totalSize: JSON.stringify(entries).length,
      oldestEntry: entries.reduce((oldest, [, entry]) => 
        !oldest || entry.timestamp < oldest ? entry.timestamp : oldest, 0 as number
      ),
      newestEntry: entries.reduce((newest, [, entry]) => 
        !newest || entry.timestamp > newest ? entry.timestamp : newest, 0 as number
      )
    };
  }, []);

  return {
    optimizedRequest,
    clearCache,
    cacheStats
  };
};
