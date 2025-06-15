
import { useApiOptimization } from '@/hooks/useApiOptimization';
import { useRequestQueue } from '@/hooks/useRequestQueue';
import { useDebouncedCallback } from '@/hooks/useDebounce';

class OptimizedApiService {
  private static instance: OptimizedApiService;
  private requestCount = 0;
  private resetTime = Date.now();
  private readonly RATE_LIMIT = 4; // Max 4 requests per minute
  private readonly RESET_INTERVAL = 60 * 1000; // 1 minute

  static getInstance(): OptimizedApiService {
    if (!OptimizedApiService.instance) {
      OptimizedApiService.instance = new OptimizedApiService();
    }
    return OptimizedApiService.instance;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter if interval has passed
    if (now - this.resetTime >= this.RESET_INTERVAL) {
      this.requestCount = 0;
      this.resetTime = now;
    }
    
    return this.requestCount < this.RATE_LIMIT;
  }

  private incrementRequestCount(): void {
    this.requestCount++;
  }

  async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    priority: number = 0
  ): Promise<T> {
    // Check rate limit
    if (!this.checkRateLimit()) {
      const waitTime = this.RESET_INTERVAL - (Date.now() - this.resetTime);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.incrementRequestCount();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  getRemainingRequests(): number {
    const now = Date.now();
    if (now - this.resetTime >= this.RESET_INTERVAL) {
      return this.RATE_LIMIT;
    }
    return Math.max(0, this.RATE_LIMIT - this.requestCount);
  }

  getResetTime(): number {
    return this.resetTime + this.RESET_INTERVAL;
  }
}

export const apiService = OptimizedApiService.getInstance();

// Hook for using optimized API calls
export const useOptimizedApi = () => {
  const { optimizedRequest, clearCache, cacheStats } = useApiOptimization();
  const { addToQueue, queueLength, isProcessing } = useRequestQueue(2);
  
  const makeOptimizedRequest = useDebouncedCallback(async <T>(
    url: string,
    options: RequestInit = {},
    priority: number = 0
  ): Promise<T> => {
    return optimizedRequest(
      () => addToQueue(() => apiService.makeRequest<T>(url, options, priority), priority),
      url,
      options
    );
  }, 300);

  return {
    makeRequest: makeOptimizedRequest,
    clearCache,
    cacheStats,
    queueLength,
    isProcessing,
    remainingRequests: apiService.getRemainingRequests(),
    resetTime: apiService.getResetTime()
  };
};
