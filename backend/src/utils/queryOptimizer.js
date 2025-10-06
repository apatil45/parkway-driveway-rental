const { sequelize } = require('../../../models');
const { QueryTypes } = require('sequelize');

const performanceStats = {
  totalQueries: 0,
  slowQueries: 0,
  queryTimes: [], // Store recent query times
  avgQueryTime: 0,
  connectionPoolUsage: {
    max: 10, // Default max connections
    current: 0,
    inUse: 0,
    queued: 0,
  },
};

/**
 * Optimizes the Sequelize connection pool settings.
 * This should be called once during application startup.
 */
const optimizeConnectionPool = async () => {
  try {
    // Example: Adjust pool settings dynamically or based on environment
    sequelize.options.pool = {
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
      min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5,
      acquire: process.env.DB_POOL_ACQUIRE ? parseInt(process.env.DB_POOL_ACQUIRE) : 30000, // 30 seconds
      idle: process.env.DB_POOL_IDLE ? parseInt(process.env.DB_POOL_IDLE) : 10000, // 10 seconds
    };
    performanceStats.connectionPoolUsage.max = sequelize.options.pool.max;
    console.log('✅ Sequelize connection pool optimized:', sequelize.options.pool);
  } catch (error) {
    console.error('❌ Error optimizing connection pool:', error);
  }
};

/**
 * Tracks query performance.
 * @param query The SQL query string.
 * @param duration The execution time of the query in milliseconds.
 * @param isSlow Whether the query is considered slow.
 */
const trackQueryPerformance = (query, duration, isSlow = false) => {
  performanceStats.totalQueries++;
  performanceStats.queryTimes.push(duration);

  // Keep only the last 100 query times for average calculation
  if (performanceStats.queryTimes.length > 100) {
    performanceStats.queryTimes.shift();
  }

  performanceStats.avgQueryTime =
    performanceStats.queryTimes.reduce((sum, time) => sum + time, 0) / performanceStats.queryTimes.length;

  if (isSlow) {
    performanceStats.slowQueries++;
    console.warn(`⚠️ Slow Query Detected (${duration}ms): ${query}`);
  }
};

/**
 * Gets current performance statistics.
 * @returns Performance statistics object.
 */
const getPerformanceStats = async () => {
  try {
    // Update connection pool usage (this might require deeper integration with Sequelize's internal pool)
    // For now, we'll simulate or use available metrics if exposed by Sequelize.
    // In a real-world scenario, you'd use a library like 'generic-pool' directly or access Sequelize's pool instance.
    // Example: const pool = sequelize.connectionManager.pool;
    // performanceStats.connectionPoolUsage.current = pool.size;
    // performanceStats.connectionPoolUsage.inUse = pool.borrowed;
    // performanceStats.connectionPoolUsage.queued = pool.pending;

    return { ...performanceStats };
  } catch (error) {
    console.error('❌ Error getting performance stats:', error);
    return { ...performanceStats, error: error.message };
  }
};

/**
 * Example of an optimized driveway search query.
 * This function is illustrative and would be integrated into your driveway routes.
 * @param {object} filters - Search filters (e.g., { latitude, longitude, radius, date, startTime, endTime, carSize })
 * @returns {Promise<Array>} - Array of driveways.
 */
const findOptimizedDriveways = async (filters) => {
  const { latitude, longitude, radius, date, startTime, endTime, carSize } = filters;

  // Build a dynamic query based on available filters
  let whereConditions = [];
  let replacements = {};

  if (latitude && longitude && radius) {
    // Using Haversine formula for spatial search (PostGIS would be better for large scale)
    whereConditions.push(
      sequelize.literal(
        `ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
            ST_SetSRID(ST_MakePoint(:searchLongitude, :searchLatitude), 4326),
            :searchRadius * 1609.34 // Convert miles to meters
          )`
      )
    );
    replacements.searchLongitude = longitude;
    replacements.searchLatitude = latitude;
    replacements.searchRadius = radius;
  }

  if (carSize) {
    whereConditions.push('carSize = :carSize');
    replacements.carSize = carSize;
  }

  // Add time-based filtering for availability (simplified)
  if (date && startTime && endTime) {
    // This assumes a simple availability model. A real system would need a more complex booking conflict check.
    // For now, we'll just ensure the driveway is generally available.
    // More complex logic would involve checking against existing bookings.
  }

  const query = `
      SELECT *
      FROM "Driveways"
      WHERE ${whereConditions.length > 0 ? whereConditions.join(' AND ') : 'TRUE'}
      LIMIT 100;
    `;

  const startTimeMs = performance.now();
  const driveways = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    model: sequelize.models.Driveway, // If you want Sequelize instances
    mapToModel: true,
  });
  const duration = performance.now() - startTimeMs;
  trackQueryPerformance(query, duration, duration > 500); // Mark as slow if > 500ms

  return driveways;
};

module.exports = {
  optimizeConnectionPool,
  trackQueryPerformance,
  getPerformanceStats,
  findOptimizedDriveways, // Export for use in routes
};
