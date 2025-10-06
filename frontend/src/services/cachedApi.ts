// Cached API Service for Parkway.com
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiCache from './apiCache';
import { performanceMonitor } from './performanceMonitor';
import errorHandler, { ErrorContext } from './errorHandler';

interface CachedRequestConfig extends AxiosRequestConfig {
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  context?: ErrorContext;
  retry?: boolean;
  maxRetries?: number;
}

class CachedAPIService {
  // GET request with caching and enhanced error handling
  async get<T>(url: string, config?: CachedRequestConfig): Promise<AxiosResponse<T>> {
    const { 
      cache = true, 
      cacheTTL, 
      cacheKey, 
      context = { operation: 'GET', component: 'API' },
      retry = true,
      maxRetries = 3,
      ...axiosConfig 
    } = config || {};
    
    // Generate cache key
    const key = cacheKey || apiCache.generateKey('GET', url, axiosConfig.params);
    
    // Check cache first
    if (cache) {
      const cachedData = apiCache.get<T>(key);
      if (cachedData) {
        // Return cached data in axios response format
        return {
          data: cachedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: axiosConfig,
          request: {}
        } as AxiosResponse<T>;
      }
    }
    
    // Make actual API call with retry logic
    const makeRequest = async (): Promise<AxiosResponse<T>> => {
      const startTime = performance.now();
      try {
        const response = await axios.get<T>(url, axiosConfig);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Track API performance
        performanceMonitor.trackAPICall(url, responseTime, response.status, JSON.stringify(response.data).length);
        
        // Cache successful responses
        if (cache && response.status === 200) {
          apiCache.set(key, response.data, cacheTTL);
        }
        
        return response;
      } catch (error: any) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Track failed API calls
        performanceMonitor.trackAPICall(url, responseTime, error.response?.status || 0, 0);
        
        throw error;
      }
    };

    if (retry) {
      return await errorHandler.withRetry(makeRequest, context, maxRetries);
    } else {
      try {
        return await makeRequest();
      } catch (error) {
        throw errorHandler.handleAPIError(error, context);
      }
    }
  }

  // POST request with enhanced error handling
  async post<T>(url: string, data?: any, config?: CachedRequestConfig): Promise<AxiosResponse<T>> {
    const { 
      cache = false, 
      cacheKey, 
      context = { operation: 'POST', component: 'API' },
      retry = false, // Don't retry POST by default
      maxRetries = 1,
      ...axiosConfig 
    } = config || {};
    
    const makeRequest = async (): Promise<AxiosResponse<T>> => {
      const startTime = performance.now();
      try {
        const response = await axios.post<T>(url, data, axiosConfig);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Track API performance
        performanceMonitor.trackAPICall(url, responseTime, response.status, JSON.stringify(response.data).length);
        
        // Cache successful responses if requested
        if (cache && response.status === 200) {
          const key = cacheKey || apiCache.generateKey('POST', url);
          apiCache.set(key, response.data, config?.cacheTTL);
        }
        
        // Invalidate related cache entries for POST requests
        this.invalidateRelatedCache(url);
        
        return response;
      } catch (error: any) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Track failed API calls
        performanceMonitor.trackAPICall(url, responseTime, error.response?.status || 0, 0);
        
        throw error;
      }
    };

    if (retry) {
      return await errorHandler.withRetry(makeRequest, context, maxRetries);
    } else {
      try {
        return await makeRequest();
      } catch (error) {
        throw errorHandler.handleAPIError(error, context);
      }
    }
  }

  // PUT request (no caching, invalidates cache)
  async put<T>(url: string, data?: any, config?: CachedRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await axios.put<T>(url, data, config);
      
      // Invalidate related cache entries
      this.invalidateRelatedCache(url);
      
      return response;
    } catch (error) {
      console.error(`API PUT Error for ${url}:`, error);
      throw error;
    }
  }

  // DELETE request (no caching, invalidates cache)
  async delete<T>(url: string, config?: CachedRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await axios.delete<T>(url, config);
      
      // Invalidate related cache entries
      this.invalidateRelatedCache(url);
      
      return response;
    } catch (error) {
      console.error(`API DELETE Error for ${url}:`, error);
      throw error;
    }
  }

  // Invalidate cache entries related to a URL
  private invalidateRelatedCache(url: string): void {
    const urlParts = url.split('/');
    const basePath = urlParts.slice(0, -1).join('/');
    
    // Get all cache keys
    const stats = apiCache.getStats();
    
    // This is a simplified invalidation - in a real app you'd want more sophisticated cache invalidation
    console.log(`🗑️ API Cache: Invalidating cache for ${url}`);
    
    // For now, we'll clear all cache on mutations
    // In production, you'd want more granular invalidation
    if (url.includes('/api/driveways') || url.includes('/api/bookings')) {
      apiCache.clear();
    }
  }

  // Clear all cache
  clearCache(): void {
    apiCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return apiCache.getStats();
  }

  // Preload data into cache
  async preload<T>(url: string, config?: CachedRequestConfig): Promise<void> {
    try {
      await this.get<T>(url, { ...config, cache: true });
      console.log(`📦 API Cache: Preloaded ${url}`);
    } catch (error) {
      console.error(`API Preload Error for ${url}:`, error);
    }
  }
}

// Create singleton instance
const cachedApi = new CachedAPIService();

export default cachedApi;
