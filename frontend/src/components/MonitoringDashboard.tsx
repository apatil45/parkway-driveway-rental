// Monitoring Dashboard Component for Parkway.com
import React, { useState, useEffect, useCallback } from 'react';
import cachedApi from '../services/cachedApi';
import useLoadingState from '../hooks/useLoadingState';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner';
import './MonitoringDashboard.css';

interface SystemInfo {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  platform: string;
  nodeVersion: string;
}

interface QueryPerformance {
  totalQueries: number;
  avgExecutionTime: number;
  slowQueries: number;
  slowQueryPercentage: number;
  recentQueries: Array<{
    query: string;
    executionTime: number;
    rowsReturned: number;
    timestamp: string;
  }>;
}

interface DatabasePerformance {
  indexStats: Array<{
    tablename: string;
    indexname: string;
    index_scans: number;
    tuples_read: number;
  }>;
  tableSizes: Array<{
    tablename: string;
    size: string;
    size_bytes: number;
  }>;
  slowQueries: Array<{
    query: string;
    calls: number;
    total_time: number;
    mean_time: number;
  }>;
}

interface PerformanceData {
  queryPerformance: QueryPerformance;
  databasePerformance: DatabasePerformance;
  systemInfo: SystemInfo;
  timestamp: string;
}

const MonitoringDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const [loadingState, loadingActions] = useLoadingState({
    initialMessage: 'Loading performance data...',
    estimatedDuration: 2000,
    showProgress: true
  });

  const fetchPerformanceData = useCallback(async () => {
    try {
      loadingActions.start('Fetching performance data...');
      
      const response = await cachedApi.get('/api/performance', {
        context: { operation: 'monitoring', component: 'MonitoringDashboard' },
        cache: false
      });

      setPerformanceData(response.data);
      loadingActions.complete('Performance data loaded');
    } catch (error: any) {
      loadingActions.error(`Failed to load performance data: ${error.message}`);
    }
  }, [loadingActions]);

  // Auto-refresh effect
  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPerformanceData, autoRefresh, refreshInterval]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getHealthStatus = (data: PerformanceData) => {
    const { queryPerformance, systemInfo } = data;
    
    if (queryPerformance.slowQueryPercentage > 20) return 'warning';
    if (systemInfo.memory.heapUsed / systemInfo.memory.heapTotal > 0.9) return 'critical';
    if (queryPerformance.avgExecutionTime > 1000) return 'warning';
    
    return 'healthy';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loadingState.isLoading) {
    return (
      <div className="monitoring-dashboard">
        <div className="dashboard-header">
          <h2>System Monitoring</h2>
        </div>
        <div className="loading-container">
          <EnhancedLoadingSpinner 
            loadingState={loadingState}
            variant="progress"
            size="large"
            showMessage={true}
            showProgress={true}
          />
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="monitoring-dashboard">
        <div className="dashboard-header">
          <h2>System Monitoring</h2>
        </div>
        <div className="error-container">
          <p>Failed to load performance data</p>
          <button onClick={fetchPerformanceData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus(performanceData);

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h2>System Monitoring</h2>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-interval"
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button onClick={fetchPerformanceData} className="refresh-button">
            Refresh Now
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className="health-status">
        <div className="health-indicator" style={{ backgroundColor: getHealthColor(healthStatus) }}>
          <span className="health-text">{healthStatus.toUpperCase()}</span>
        </div>
        <div className="last-updated">
          Last updated: {new Date(performanceData.timestamp).toLocaleString()}
        </div>
      </div>

      {/* System Overview */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>System Uptime</h3>
          <div className="metric-value">{formatUptime(performanceData.systemInfo.uptime)}</div>
        </div>

        <div className="metric-card">
          <h3>Memory Usage</h3>
          <div className="metric-value">
            {formatBytes(performanceData.systemInfo.memory.heapUsed)} / {formatBytes(performanceData.systemInfo.memory.heapTotal)}
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar"
              style={{ 
                width: `${(performanceData.systemInfo.memory.heapUsed / performanceData.systemInfo.memory.heapTotal) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Total Queries</h3>
          <div className="metric-value">{performanceData.queryPerformance.totalQueries.toLocaleString()}</div>
        </div>

        <div className="metric-card">
          <h3>Avg Query Time</h3>
          <div className="metric-value">{performanceData.queryPerformance.avgExecutionTime}ms</div>
        </div>

        <div className="metric-card">
          <h3>Slow Queries</h3>
          <div className="metric-value">
            {performanceData.queryPerformance.slowQueries} ({performanceData.queryPerformance.slowQueryPercentage}%)
          </div>
        </div>

        <div className="metric-card">
          <h3>Node Version</h3>
          <div className="metric-value">{performanceData.systemInfo.nodeVersion}</div>
        </div>
      </div>

      {/* Database Performance */}
      <div className="section">
        <h3>Database Performance</h3>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Index</th>
                <th>Scans</th>
                <th>Tuples Read</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.databasePerformance.indexStats.slice(0, 10).map((stat, index) => (
                <tr key={index}>
                  <td>{stat.tablename}</td>
                  <td>{stat.indexname}</td>
                  <td>{stat.index_scans.toLocaleString()}</td>
                  <td>{stat.tuples_read.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Queries */}
      <div className="section">
        <h3>Recent Queries</h3>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Execution Time</th>
                <th>Rows</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.queryPerformance.recentQueries.map((query, index) => (
                <tr key={index} className={query.executionTime > 1000 ? 'slow-query' : ''}>
                  <td className="query-cell">{query.query}</td>
                  <td>{query.executionTime}ms</td>
                  <td>{query.rowsReturned}</td>
                  <td>{new Date(query.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Sizes */}
      <div className="section">
        <h3>Database Table Sizes</h3>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Size</th>
                <th>Size (Bytes)</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.databasePerformance.tableSizes.map((table, index) => (
                <tr key={index}>
                  <td>{table.tablename}</td>
                  <td>{table.size}</td>
                  <td>{table.size_bytes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
