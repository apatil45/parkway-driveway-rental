// API Cache Service for Parkway.com
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  // Set cache entry
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
    
    console.log(`📦 API Cache: Cached ${key} (expires in ${Math.round((expiresAt - now) / 1000)}s)`);
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`📦 API Cache: ${key} expired, removed from cache`);
      return null;
    }
    
    console.log(`📦 API Cache: Cache hit for ${key} (${Math.round((entry.expiresAt - now) / 1000)}s remaining)`);
    return entry.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete specific cache entry
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`📦 API Cache: Deleted ${key}`);
    }
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    console.log('📦 API Cache: Cleared all cache');
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    let clearedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`📦 API Cache: Cleared ${clearedCount} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // Generate cache key from request
  generateKey(method: string, url: string, params?: any): string {
    const baseKey = `${method.toUpperCase()}:${url}`;
    
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      return `${baseKey}?${sortedParams}`;
    }
    
    return baseKey;
  }
}

// Create singleton instance
const apiCache = new APICache();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.clearExpired();
}, 5 * 60 * 1000);

export default apiCache;
