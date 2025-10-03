/**
 * Performance Monitor Service for tracking and optimizing application performance
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
}

interface APIMetrics {
  endpoint: string;
  responseTime: number;
  status: number;
  timestamp: number;
  size: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private apiMetrics: APIMetrics[] = [];
  private isMonitoring = false;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.initializePerformanceObserver();
    this.trackPageLoad();
    this.trackMemoryUsage();
    this.trackNetworkPerformance();
    
    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, responseTime: number, status: number, size: number): void {
    const metric: APIMetrics = {
      endpoint,
      responseTime,
      status,
      timestamp: Date.now(),
      size
    };

    this.apiMetrics.push(metric);

    // Keep only last 100 API metrics
    if (this.apiMetrics.length > 100) {
      this.apiMetrics = this.apiMetrics.slice(-100);
    }

    // Log slow API calls
    if (responseTime > 2000) {
      console.warn(`🐌 Slow API call: ${endpoint} took ${responseTime}ms`);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averagePageLoad: number;
    averageAPIResponse: number;
    slowestAPIs: APIMetrics[];
    memoryUsage: number;
    totalAPICalls: number;
  } {
    const averagePageLoad = this.metrics.length > 0 
      ? this.metrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / this.metrics.length 
      : 0;

    const averageAPIResponse = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.apiMetrics.length
      : 0;

    const slowestAPIs = [...this.apiMetrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 5);

    const memoryUsage = this.getCurrentMemoryUsage();

    return {
      averagePageLoad,
      averageAPIResponse,
      slowestAPIs,
      memoryUsage,
      totalAPICalls: this.apiMetrics.length
    };
  }

  /**
   * Initialize Performance Observer
   */
  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.trackRenderTime(entry.name, entry.duration);
            }
          }
        });

        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  /**
   * Track page load time
   */
  private trackPageLoad(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.push({
          pageLoadTime: loadTime,
          apiResponseTime: 0,
          renderTime: 0,
          memoryUsage: this.getCurrentMemoryUsage(),
          networkLatency: navigation.responseEnd - navigation.requestStart
        });

        console.log(`📊 Page load time: ${(loadTime || 0).toFixed(2)}ms`);
      }
    });
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        
        if (usedMB > 50) { // Warn if using more than 50MB
          console.warn(`🧠 High memory usage: ${(usedMB || 0).toFixed(2)}MB / ${(totalMB || 0).toFixed(2)}MB`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Track network performance
   */
  private trackNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const logNetworkInfo = () => {
        console.log(`🌐 Network: ${connection.effectiveType || 'unknown'}, ${connection.downlink || 'unknown'}Mbps`);
      };

      logNetworkInfo();
      connection.addEventListener('change', logNetworkInfo);
    }
  }

  /**
   * Track render time
   */
  private trackRenderTime(componentName: string, duration: number): void {
    if (duration > 16) { // Warn if render takes more than 16ms (60fps threshold)
      console.warn(`🎨 Slow render: ${componentName} took ${(duration || 0).toFixed(2)}ms`);
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Return in MB
    }
    return 0;
  }

  /**
   * Measure component render time
   */
  measureRenderTime(componentName: string, renderFunction: () => void): void {
    performance.mark(`${componentName}-start`);
    renderFunction();
    performance.mark(`${componentName}-end`);
    performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);
  }

  /**
   * Get API performance insights
   */
  getAPIPerformanceInsights(): {
    slowestEndpoints: string[];
    averageResponseTime: number;
    errorRate: number;
    recommendations: string[];
  } {
    const endpointStats = new Map<string, { total: number; sum: number; errors: number }>();

    this.apiMetrics.forEach(metric => {
      const stats = endpointStats.get(metric.endpoint) || { total: 0, sum: 0, errors: 0 };
      stats.total++;
      stats.sum += metric.responseTime;
      if (metric.status >= 400) stats.errors++;
      endpointStats.set(metric.endpoint, stats);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.sum / stats.total
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 3)
      .map(item => item.endpoint);

    const averageResponseTime = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.apiMetrics.length
      : 0;

    const errorRate = this.apiMetrics.length > 0
      ? this.apiMetrics.filter(m => m.status >= 400).length / this.apiMetrics.length
      : 0;

    const recommendations: string[] = [];
    if (averageResponseTime > 1000) {
      recommendations.push('Consider implementing API caching');
    }
    if (errorRate > 0.05) {
      recommendations.push('High error rate detected - check API stability');
    }
    if (slowestEndpoints.length > 0) {
      recommendations.push(`Optimize slow endpoints: ${slowestEndpoints.join(', ')}`);
    }

    return {
      slowestEndpoints,
      averageResponseTime,
      errorRate,
      recommendations
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
