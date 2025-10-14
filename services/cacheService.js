/**
 * Redis Cache Service for API Response Caching
 * Provides high-performance caching for frequently accessed data
 */

const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Use Redis URL if available, otherwise use local Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('⚠️ Redis server connection refused, caching disabled');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.warn('⚠️ Redis retry time exhausted, caching disabled');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.warn('⚠️ Redis max retry attempts reached, caching disabled');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        // Only log Redis errors once to avoid flooding console
        if (!this.errorLogged) {
          console.warn('⚠️ Redis Client Error:', err.message);
          console.warn('💡 Caching will be disabled. To enable Redis caching, install and start Redis server.');
          this.errorLogged = true;
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready for operations');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('📴 Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, caching disabled:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('⚠️ Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.warn('⚠️ Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn('⚠️ Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Cache pattern delete error:', error.message);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('⚠️ Cache exists error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return {
        connected: false,
        keys: 0,
        memory: 'N/A'
      };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();
      
      return {
        connected: true,
        keys: keys,
        memory: info
      };
    } catch (error) {
      console.warn('⚠️ Cache stats error:', error.message);
      return {
        connected: false,
        keys: 0,
        memory: 'Error'
      };
    }
  }

  /**
   * Cache middleware for Express routes
   */
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      // Generate cache key
      const cacheKey = keyGenerator ? 
        keyGenerator(req) : 
        `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

      try {
        // Try to get from cache
        const cachedData = await this.get(cacheKey);
        
        if (cachedData) {
          console.log(`📦 Cache HIT: ${cacheKey}`);
          return res.json({
            ...cachedData,
            _cached: true,
            _cacheKey: cacheKey
          });
        }

        console.log(`📦 Cache MISS: ${cacheKey}`);
        
        // Store original res.json
        const originalJson = res.json.bind(res);
        
        // Override res.json to cache the response
        res.json = (data) => {
          // Cache the response
          this.set(cacheKey, data, ttl).catch(err => {
            console.warn('⚠️ Failed to cache response:', err.message);
          });
          
          // Call original res.json
          return originalJson(data);
        };
        
        next();
        
      } catch (error) {
        console.warn('⚠️ Cache middleware error:', error.message);
        next();
      }
    };
  }

  /**
   * Generate cache key for driveway search
   */
  generateDrivewaySearchKey(req) {
    const { latitude, longitude, radius, date, startTime, endTime, searchMode } = req.query;
    return `driveways:search:${latitude || 'null'}:${longitude || 'null'}:${radius || 'null'}:${date || 'null'}:${startTime || 'null'}:${endTime || 'null'}:${searchMode || 'null'}`;
  }

  /**
   * Generate cache key for user's driveways
   */
  generateUserDrivewaysKey(userId) {
    return `driveways:user:${userId}`;
  }

  /**
   * Generate cache key for user's bookings
   */
  generateUserBookingsKey(userId) {
    return `bookings:user:${userId}`;
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCaches(userId) {
    const patterns = [
      `driveways:user:${userId}`,
      `bookings:user:${userId}`,
      `driveways:search:*` // Invalidate all search caches when user data changes
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('📴 Redis connection closed');
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
