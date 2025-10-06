const { sequelize } = require('../../../models');
const { QueryTypes } = require('sequelize');

const indexPerformance = {
  indexesCreated: 0,
  indexesAnalyzed: 0,
  lastAnalysisTime: null,
  tableSizes: {},
  slowQueriesDetected: [],
};

/**
 * Creates essential database indexes for performance.
 * This should be called after database synchronization.
 */
const createAllIndexes = async () => {
  console.log('⚙️ Creating database indexes...');
  try {
    // User table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "users_email_idx" ON "Users" (email);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "users_role_idx" ON "Users" (role);');

    // Driveway table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_ownerId_idx" ON "Driveways" ("ownerId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_location_idx" ON "Driveways" (latitude, longitude);');
    // For spatial queries, if PostGIS is enabled:
    // await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    // await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_geom_idx" ON "Driveways" USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_carSize_idx" ON "Driveways" ("carSize");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_availability_idx" ON "Driveways" ("isAvailable");');

    // Booking table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_driverId_idx" ON "Bookings" ("driverId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_drivewayId_idx" ON "Bookings" ("drivewayId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "Bookings" (status);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_time_range_idx" ON "Bookings" ("startTime", "endTime");');

    indexPerformance.indexesCreated = (await sequelize.query('SELECT count(*) FROM pg_indexes WHERE schemaname = current_schema();', { type: QueryTypes.SELECT }))[0].count;

    console.log('✅ Database indexes created/ensured.');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

/**
 * Analyzes all tables to update statistics for the query planner.
 */
const analyzeTables = async () => {
  console.log('📊 Analyzing database tables...');
  try {
    await sequelize.query('ANALYZE VERBOSE;');
    indexPerformance.indexesAnalyzed = (await sequelize.query('SELECT count(*) FROM pg_stat_all_tables WHERE schemaname = current_schema();', { type: QueryTypes.SELECT }))[0].count;
    indexPerformance.lastAnalysisTime = new Date().toISOString();
    console.log('✅ Database tables analyzed.');

    // Get table sizes
    const tableSizes = await sequelize.query(`
        SELECT
          relname AS table_name,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          pg_size_pretty(pg_relation_size(relid)) AS data_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC;
      `, { type: QueryTypes.SELECT });
    indexPerformance.tableSizes = tableSizes.reduce((acc, row) => {
      acc[row.table_name] = { total_size: row.total_size, data_size: row.data_size, index_size: row.index_size };
      return acc;
    }, {});

  } catch (error) {
    console.error('❌ Error analyzing database tables:', error);
  }
};

/**
 * Optimizes PostgreSQL configuration settings for better performance.
 * This should be done with caution and understanding of your server's resources.
 */
const optimizeDatabaseSettings = async () => {
  console.log('⚙️ Optimizing database settings...');
  try {
    // These are examples and should be configured based on your server's RAM and workload
    // For a production environment, these would typically be set in postgresql.conf
    // and require superuser privileges. We'll just log them here.
    const settings = [
      // { name: 'shared_buffers', value: '256MB' }, // 25% of RAM
      // { name: 'effective_cache_size', value: '768MB' }, // 75% of RAM
      // { name: 'work_mem', value: '16MB' }, // Per-operation memory
      // { name: 'maintenance_work_mem', value: '128MB' }, // For VACUUM, CREATE INDEX
      // { name: 'max_connections', value: '100' },
      // { name: 'wal_buffers', value: '16MB' },
      // { name: 'checkpoint_timeout', value: '10min' },
      // { name: 'random_page_cost', value: '1.1' }, // SSDs
      // { name: 'cpu_tuple_cost', value: '0.1' },
      // { name: 'cpu_index_tuple_cost', value: '0.05' },
      // { name: 'cpu_operator_cost', value: '0.0025' },
    ];

    for (const setting of settings) {
      // await sequelize.query(`SET ${setting.name} = '${setting.value}';`);
      console.log(`   - Recommended setting: ${setting.name} = ${setting.value}`);
    }

    console.log('✅ Database settings optimization recommendations logged. Apply to postgresql.conf for persistence.');
  } catch (error) {
    console.error('❌ Error optimizing database settings:', error);
  }
};

/**
 * Retrieves a summary of database performance, including index usage and slow queries.
 */
const getPerformanceSummary = async () => {
  try {
    // Get index usage statistics
    const indexUsage = await sequelize.query(`
        SELECT
          relname AS table_name,
          indexrelname AS index_name,
          idx_scan AS index_scans,
          idx_tup_read AS index_tuples_read,
          idx_tup_fetch AS index_tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC;
      `, { type: QueryTypes.SELECT });

    // Get slow queries (requires logging slow queries in postgresql.conf)
    // This is illustrative; actual slow query logs would be parsed from server logs.
    const slowQueries = await sequelize.query(`
        SELECT query, calls, total_time, mean_time, rows, 
               100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read) AS hit_percent
        FROM pg_stat_statements
        WHERE total_time > 1000 -- queries slower than 1 second
        ORDER BY total_time DESC
        LIMIT 10;
      `, { type: QueryTypes.SELECT }).catch(() => []); // pg_stat_statements might not be enabled

    return {
      ...indexPerformance,
      indexUsage,
      slowQueries,
    };
  } catch (error) {
    console.error('❌ Error retrieving database performance summary:', error);
    return { ...indexPerformance, error: error.message };
  }
};

module.exports = {
  createAllIndexes,
  analyzeTables,
  optimizeDatabaseSettings,
  getPerformanceSummary,
};
