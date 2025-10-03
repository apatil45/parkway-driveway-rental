import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '../services/performanceMonitor';
import { offlineService } from '../services/offlineService';

const PerformanceOptimizer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Start performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.startMonitoring();
      
      // Update metrics every 5 seconds
      const interval = setInterval(() => {
        setMetrics(performanceMonitor.getPerformanceSummary());
      }, 5000);

      return () => {
        clearInterval(interval);
        performanceMonitor.stopMonitoring();
      };
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 9999,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '300px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Performance Monitor</h3>
            <button
              onClick={toggleVisibility}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>

          {metrics && (
            <div>
              {/* Page Load Performance */}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#059669' }}>📄 Page Load:</strong>
                <div style={{ marginLeft: '8px' }}>
                  <div>Average: {(metrics.averagePageLoad || 0).toFixed(2)}ms</div>
                </div>
              </div>

              {/* API Performance */}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#3b82f6' }}>🌐 API Calls:</strong>
                <div style={{ marginLeft: '8px' }}>
                  <div>Total: {metrics.totalAPICalls}</div>
                  <div>Average Response: {(metrics.averageAPIResponse || 0).toFixed(2)}ms</div>
                </div>
              </div>

              {/* Memory Usage */}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#dc2626' }}>🧠 Memory:</strong>
                <div style={{ marginLeft: '8px' }}>
                  <div>Usage: {(metrics.memoryUsage || 0).toFixed(2)}MB</div>
                </div>
              </div>

              {/* Network Status */}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#7c3aed' }}>📡 Network:</strong>
                <div style={{ marginLeft: '8px' }}>
                  <div>Status: {offlineService.isOnline() ? '🟢 Online' : '🔴 Offline'}</div>
                  <div>Type: {offlineService.getNetworkStatus().effectiveType || 'Unknown'}</div>
                </div>
              </div>

              {/* Slowest APIs */}
              {metrics.slowestAPIs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#ea580c' }}>🐌 Slowest APIs:</strong>
                  <div style={{ marginLeft: '8px' }}>
                    {metrics.slowestAPIs.slice(0, 3).map((api: any, index: number) => (
                      <div key={index} style={{ fontSize: '11px' }}>
                        {api.endpoint}: {(api.responseTime || 0).toFixed(2)}ms
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div style={{ marginTop: '12px', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
                <strong style={{ color: '#374151' }}>💡 Tips:</strong>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  {metrics.averageAPIResponse > 1000 && <div>• Consider API caching</div>}
                  {metrics.memoryUsage > 50 && <div>• High memory usage detected</div>}
                  {metrics.averagePageLoad > 3000 && <div>• Page load is slow</div>}
                  {!offlineService.isOnline() && <div>• You are offline</div>}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                performance.clearMarks();
                performance.clearMeasures();
                console.log('🧹 Performance marks cleared');
              }}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Clear Marks
            </button>
            <button
              onClick={() => {
                const insights = performanceMonitor.getAPIPerformanceInsights();
                console.log('📊 API Performance Insights:', insights);
              }}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              API Insights
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceOptimizer;