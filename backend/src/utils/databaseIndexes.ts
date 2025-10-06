// Database Indexes for Parkway.com Performance Optimization
import { sequelize } from '../models';

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
  partial?: string;
  concurrent?: boolean;
}

class DatabaseIndexManager {
  private indexes: IndexDefinition[] = [
    // User table indexes
    {
      name: 'idx_users_email',
      table: 'users',
      columns: ['email'],
      unique: true
    },
    {
      name: 'idx_users_role',
      table: 'users',
      columns: ['role']
    },
    {
      name: 'idx_users_is_active',
      table: 'users',
      columns: ['is_active']
    },
    {
      name: 'idx_users_created_at',
      table: 'users',
      columns: ['created_at']
    },

    // Driveway table indexes
    {
      name: 'idx_driveways_owner_id',
      table: 'driveways',
      columns: ['owner_id']
    },
    {
      name: 'idx_driveways_is_active',
      table: 'driveways',
      columns: ['is_active']
    },
    {
      name: 'idx_driveways_is_available',
      table: 'driveways',
      columns: ['is_available']
    },
    {
      name: 'idx_driveways_price',
      table: 'driveways',
      columns: ['price']
    },
    {
      name: 'idx_driveways_car_size',
      table: 'driveways',
      columns: ['car_size']
    },
    {
      name: 'idx_driveways_location',
      table: 'driveways',
      columns: ['latitude', 'longitude']
    },
    {
      name: 'idx_driveways_created_at',
      table: 'driveways',
      columns: ['created_at']
    },
    {
      name: 'idx_driveways_search',
      table: 'driveways',
      columns: ['title', 'description', 'address']
    },
    {
      name: 'idx_driveways_active_available',
      table: 'driveways',
      columns: ['is_active', 'is_available']
    },
    {
      name: 'idx_driveways_price_range',
      table: 'driveways',
      columns: ['price', 'is_active', 'is_available']
    },

    // Booking table indexes
    {
      name: 'idx_bookings_user_id',
      table: 'bookings',
      columns: ['user_id']
    },
    {
      name: 'idx_bookings_driveway_id',
      table: 'bookings',
      columns: ['driveway_id']
    },
    {
      name: 'idx_bookings_status',
      table: 'bookings',
      columns: ['status']
    },
    {
      name: 'idx_bookings_payment_status',
      table: 'bookings',
      columns: ['payment_status']
    },
    {
      name: 'idx_bookings_time_range',
      table: 'bookings',
      columns: ['start_time', 'end_time']
    },
    {
      name: 'idx_bookings_created_at',
      table: 'bookings',
      columns: ['created_at']
    },
    {
      name: 'idx_bookings_conflict_check',
      table: 'bookings',
      columns: ['driveway_id', 'status', 'start_time', 'end_time']
    },
    {
      name: 'idx_bookings_payment_intent',
      table: 'bookings',
      columns: ['payment_intent_id']
    },
    {
      name: 'idx_bookings_stripe_session',
      table: 'bookings',
      columns: ['stripe_session_id']
    },

    // Composite indexes for common queries
    {
      name: 'idx_driveways_owner_active',
      table: 'driveways',
      columns: ['owner_id', 'is_active']
    },
    {
      name: 'idx_bookings_user_status',
      table: 'bookings',
      columns: ['user_id', 'status']
    },
    {
      name: 'idx_bookings_driveway_status',
      table: 'bookings',
      columns: ['driveway_id', 'status']
    },
    {
      name: 'idx_bookings_time_status',
      table: 'bookings',
      columns: ['start_time', 'end_time', 'status']
    }
  ];

  // Create all indexes
  async createAllIndexes() {
    console.log('🔧 Creating database indexes for optimal performance...');
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const index of this.indexes) {
      try {
        await this.createIndex(index);
        createdCount++;
        console.log(`✅ Created index: ${index.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          skippedCount++;
          console.log(`⏭️  Index already exists: ${index.name}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to create index ${index.name}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Index creation summary:`);
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total: ${this.indexes.length}`);
  }

  // Create individual index
  private async createIndex(index: IndexDefinition) {
    const columns = index.columns.join(', ');
    const unique = index.unique ? 'UNIQUE ' : '';
    const concurrent = index.concurrent ? 'CONCURRENTLY ' : '';
    const partial = index.partial ? ` WHERE ${index.partial}` : '';

    const query = `
      CREATE ${concurrent}${unique}INDEX IF NOT EXISTS ${index.name}
      ON ${index.table} (${columns})
      ${partial}
    `;

    await sequelize.query(query);
  }

  // Drop all indexes (for testing/cleanup)
  async dropAllIndexes() {
    console.log('🗑️  Dropping all custom indexes...');
    
    for (const index of this.indexes) {
      try {
        await sequelize.query(`DROP INDEX IF EXISTS ${index.name}`);
        console.log(`✅ Dropped index: ${index.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to drop index ${index.name}:`, error.message);
      }
    }
  }

  // Analyze table statistics for query planner
  async analyzeTables() {
    console.log('📊 Analyzing table statistics for query optimization...');
    
    const tables = ['users', 'driveways', 'bookings'];
    
    for (const table of tables) {
      try {
        await sequelize.query(`ANALYZE ${table}`);
        console.log(`✅ Analyzed table: ${table}`);
      } catch (error: any) {
        console.error(`❌ Failed to analyze table ${table}:`, error.message);
      }
    }
  }

  // Get index usage statistics
  async getIndexUsageStats() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20
      `;

      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      console.error('Failed to get index usage stats:', error);
      return [];
    }
  }

  // Get table size information
  async getTableSizes() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      console.error('Failed to get table sizes:', error);
      return [];
    }
  }

  // Get slow query information
  async getSlowQueries() {
    try {
      const query = `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      console.error('Failed to get slow queries:', error);
      return [];
    }
  }

  // Optimize database settings
  async optimizeDatabaseSettings() {
    console.log('⚙️  Optimizing database settings...');
    
    try {
      // Enable query statistics
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
      
      // Set optimal work memory for complex queries
      await sequelize.query('SET work_mem = "256MB"');
      
      // Set optimal shared buffers
      await sequelize.query('SET shared_buffers = "256MB"');
      
      // Enable parallel queries
      await sequelize.query('SET max_parallel_workers_per_gather = 4');
      
      console.log('✅ Database settings optimized');
    } catch (error) {
      console.error('❌ Failed to optimize database settings:', error);
    }
  }

  // Get database performance summary
  async getPerformanceSummary() {
    try {
      const [indexStats, tableSizes, slowQueries] = await Promise.all([
        this.getIndexUsageStats(),
        this.getTableSizes(),
        this.getSlowQueries()
      ]);

      return {
        indexStats,
        tableSizes,
        slowQueries,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      return null;
    }
  }
}

// Create singleton instance
const databaseIndexManager = new DatabaseIndexManager();

export default databaseIndexManager;
