// Database Query Optimizer for Parkway.com
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../models';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  order?: Array<[string, 'ASC' | 'DESC']>;
  include?: any[];
  where?: any;
  attributes?: string[];
  distinct?: boolean;
  subQuery?: boolean;
  benchmark?: boolean;
}

export interface PerformanceMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  memoryUsage: number;
  timestamp: Date;
}

class QueryOptimizer {
  private performanceLog: PerformanceMetrics[] = [];
  private maxLogSize = 1000;

  // Optimized driveway search with proper indexing
  async searchDrivewaysOptimized(params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    priceMin?: number;
    priceMax?: number;
    carSize?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const startTime = Date.now();
    
    try {
      let whereClause: any = {
        isActive: true,
        isAvailable: true
      };

      // Price range filter
      if (params.priceMin !== undefined || params.priceMax !== undefined) {
        whereClause.price = {};
        if (params.priceMin !== undefined) whereClause.price[Op.gte] = params.priceMin;
        if (params.priceMax !== undefined) whereClause.price[Op.lte] = params.priceMax;
      }

      // Car size filter
      if (params.carSize) {
        whereClause.carSize = params.carSize;
      }

      // Text search optimization
      if (params.search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${params.search}%` } },
          { description: { [Op.iLike]: `%${params.search}%` } },
          { address: { [Op.iLike]: `%${params.search}%` } }
        ];
      }

      // Location-based search with spatial optimization
      let locationQuery = '';
      let locationParams: any = {};
      
      if (params.latitude && params.longitude && params.radius) {
        // Use PostGIS for efficient spatial queries
        locationQuery = `
          AND ST_DWithin(
            ST_Point(longitude, latitude)::geography,
            ST_Point(:longitude, :latitude)::geography,
            :radius * 1609.34
          )
        `;
        locationParams = {
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius
        };
      }

      // Optimized query with proper joins and indexing
      const query = `
        SELECT 
          d.*,
          u.id as owner_id,
          u.first_name,
          u.last_name,
          u.profile_image,
          ${params.latitude && params.longitude ? `
            ST_Distance(
              ST_Point(d.longitude, d.latitude)::geography,
              ST_Point(:longitude, :latitude)::geography
            ) / 1609.34 as distance_miles
          ` : 'NULL as distance_miles'}
        FROM driveways d
        INNER JOIN users u ON d.owner_id = u.id
        WHERE d.is_active = true 
          AND d.is_available = true
          ${locationQuery}
          ${params.search ? `
            AND (
              d.title ILIKE :search OR 
              d.description ILIKE :search OR 
              d.address ILIKE :search
            )
          ` : ''}
          ${params.priceMin !== undefined ? 'AND d.price >= :priceMin' : ''}
          ${params.priceMax !== undefined ? 'AND d.price <= :priceMax' : ''}
          ${params.carSize ? 'AND d.car_size = :carSize' : ''}
        ORDER BY 
          ${params.latitude && params.longitude ? 'distance_miles ASC,' : ''}
          d.created_at DESC
        LIMIT :limit OFFSET :offset
      `;

      const results = await sequelize.query(query, {
        replacements: {
          ...locationParams,
          search: params.search ? `%${params.search}%` : null,
          priceMin: params.priceMin,
          priceMax: params.priceMax,
          carSize: params.carSize,
          limit: params.limit || 20,
          offset: params.offset || 0
        },
        type: QueryTypes.SELECT,
        benchmark: true
      });

      const executionTime = Date.now() - startTime;
      this.logPerformance({
        query: 'searchDrivewaysOptimized',
        executionTime,
        rowsReturned: results.length,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return results;
    } catch (error) {
      console.error('Optimized driveway search error:', error);
      throw error;
    }
  }

  // Optimized booking conflict detection
  async checkBookingConflictsOptimized(drivewayId: number, startTime: Date, endTime: Date) {
    const startTimeMs = Date.now();
    
    try {
      // Use a single optimized query to check for conflicts
      const query = `
        SELECT COUNT(*) as conflict_count
        FROM bookings b
        WHERE b.driveway_id = :drivewayId
          AND b.status IN ('pending', 'confirmed')
          AND (
            (b.start_time < :endTime AND b.end_time > :startTime)
          )
      `;

      const result = await sequelize.query(query, {
        replacements: {
          drivewayId,
          startTime,
          endTime
        },
        type: QueryTypes.SELECT,
        benchmark: true
      });

      const executionTime = Date.now() - startTimeMs;
      this.logPerformance({
        query: 'checkBookingConflictsOptimized',
        executionTime,
        rowsReturned: 1,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return (result[0] as any).conflict_count > 0;
    } catch (error) {
      console.error('Booking conflict check error:', error);
      throw error;
    }
  }

  // Optimized user dashboard data aggregation
  async getUserDashboardDataOptimized(userId: number) {
    const startTime = Date.now();
    
    try {
      // Single query to get all dashboard data
      const query = `
        WITH user_stats AS (
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.role,
            u.created_at as member_since,
            COUNT(DISTINCT d.id) as total_driveways,
            COUNT(DISTINCT b.id) as total_bookings,
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0) as total_spent,
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0) as total_earned
          FROM users u
          LEFT JOIN driveways d ON u.id = d.owner_id AND d.is_active = true
          LEFT JOIN bookings b ON u.id = b.user_id
          WHERE u.id = :userId
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at
        ),
        recent_bookings AS (
          SELECT 
            b.*,
            d.title as driveway_title,
            d.address as driveway_address,
            owner.first_name as owner_first_name,
            owner.last_name as owner_last_name
          FROM bookings b
          INNER JOIN driveways d ON b.driveway_id = d.id
          INNER JOIN users owner ON d.owner_id = owner.id
          WHERE b.user_id = :userId
          ORDER BY b.created_at DESC
          LIMIT 5
        ),
        recent_driveways AS (
          SELECT 
            d.*,
            COUNT(b.id) as booking_count,
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0) as total_earnings
          FROM driveways d
          LEFT JOIN bookings b ON d.id = b.driveway_id
          WHERE d.owner_id = :userId AND d.is_active = true
          GROUP BY d.id
          ORDER BY d.created_at DESC
          LIMIT 5
        )
        SELECT 
          us.*,
          json_agg(DISTINCT rb.*) as recent_bookings,
          json_agg(DISTINCT rd.*) as recent_driveways
        FROM user_stats us
        LEFT JOIN recent_bookings rb ON true
        LEFT JOIN recent_driveways rd ON true
        GROUP BY us.id, us.first_name, us.last_name, us.email, us.role, us.member_since, 
                 us.total_driveways, us.total_bookings, us.total_spent, us.total_earned
      `;

      const result = await sequelize.query(query, {
        replacements: { userId },
        type: QueryTypes.SELECT,
        benchmark: true
      });

      const executionTime = Date.now() - startTime;
      this.logPerformance({
        query: 'getUserDashboardDataOptimized',
        executionTime,
        rowsReturned: result.length,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return result[0];
    } catch (error) {
      console.error('User dashboard data error:', error);
      throw error;
    }
  }

  // Optimized analytics queries
  async getAnalyticsDataOptimized(timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const startTime = Date.now();
    
    try {
      let dateFilter = '';
      switch (timeRange) {
        case 'day':
          dateFilter = "AND b.created_at >= CURRENT_DATE";
          break;
        case 'week':
          dateFilter = "AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          dateFilter = "AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case 'year':
          dateFilter = "AND b.created_at >= CURRENT_DATE - INTERVAL '365 days'";
          break;
      }

      const query = `
        WITH booking_stats AS (
          SELECT 
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN status = 'completed' THEN total_price ELSE NULL END), 0) as avg_booking_value
          FROM bookings b
          WHERE 1=1 ${dateFilter}
        ),
        driveway_stats AS (
          SELECT 
            COUNT(*) as total_driveways,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_driveways,
            COALESCE(AVG(price), 0) as avg_price,
            COALESCE(MIN(price), 0) as min_price,
            COALESCE(MAX(price), 0) as max_price
          FROM driveways
        ),
        user_stats AS (
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'driver' THEN 1 END) as total_drivers,
            COUNT(CASE WHEN role = 'owner' THEN 1 END) as total_owners,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
          FROM users
        )
        SELECT 
          bs.*,
          ds.*,
          us.*
        FROM booking_stats bs
        CROSS JOIN driveway_stats ds
        CROSS JOIN user_stats us
      `;

      const result = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        benchmark: true
      });

      const executionTime = Date.now() - startTime;
      this.logPerformance({
        query: 'getAnalyticsDataOptimized',
        executionTime,
        rowsReturned: result.length,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return result[0];
    } catch (error) {
      console.error('Analytics data error:', error);
      throw error;
    }
  }

  // Database connection pooling optimization
  async optimizeConnectionPool() {
    try {
      // Configure connection pool for optimal performance
      await sequelize.connectionManager.pool.destroyAllNow();
      
      // Recreate pool with optimized settings
      sequelize.connectionManager.pool = sequelize.connectionManager.poolFactory({
        max: 20, // Maximum connections
        min: 5,  // Minimum connections
        acquire: 30000, // Maximum time to get connection
        idle: 10000,    // Maximum idle time
        evict: 1000,    // Check for idle connections every 1s
        handleDisconnects: true
      });

      console.log('✅ Database connection pool optimized');
    } catch (error) {
      console.error('❌ Connection pool optimization failed:', error);
    }
  }

  // Query performance logging
  private logPerformance(metrics: PerformanceMetrics) {
    this.performanceLog.unshift(metrics);
    
    if (this.performanceLog.length > this.maxLogSize) {
      this.performanceLog = this.performanceLog.slice(0, this.maxLogSize);
    }

    // Log slow queries
    if (metrics.executionTime > 1000) {
      console.warn(`🐌 Slow query detected: ${metrics.query} took ${metrics.executionTime}ms`);
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    const totalQueries = this.performanceLog.length;
    const avgExecutionTime = this.performanceLog.reduce((sum, log) => sum + log.executionTime, 0) / totalQueries;
    const slowQueries = this.performanceLog.filter(log => log.executionTime > 1000).length;
    
    return {
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      slowQueries,
      slowQueryPercentage: totalQueries > 0 ? Math.round((slowQueries / totalQueries) * 100) : 0,
      recentQueries: this.performanceLog.slice(0, 10)
    };
  }

  // Clear performance log
  clearPerformanceLog() {
    this.performanceLog = [];
  }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

export default queryOptimizer;
