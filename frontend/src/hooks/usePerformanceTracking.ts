import { useCallback, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  responseTime: number;
  timestamp: number;
  operation: string;
  success: boolean;
  error?: string;
}

interface PerformanceTracker {
  trackOperation: (operation: string, startTime: number, success: boolean, error?: string) => void;
  getMetrics: () => PerformanceMetrics[];
  clearMetrics: () => void;
  getAverageResponseTime: () => number;
  getSuccessRate: () => number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  trackOperation(operation: string, startTime: number, success: boolean, error?: string): void {
    const responseTime = Date.now() - startTime;
    const metric: PerformanceMetrics = {
      responseTime,
      timestamp: Date.now(),
      operation,
      success,
      error
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const status = success ? '✅' : '❌';
      console.log(`${status} ${operation}: ${responseTime}ms${error ? ` - ${error}` : ''}`);
    }

    // Send to analytics if enabled
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      this.sendToAnalytics(metric);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return totalTime / this.metrics.length;
  }

  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const successfulOperations = this.metrics.filter(metric => metric.success).length;
    return (successfulOperations / this.metrics.length) * 100;
  }

  private sendToAnalytics(metric: PerformanceMetrics): void {
    // In a real application, you would send this to your analytics service
    // For now, we'll just log it
    console.log('Analytics:', {
      event: 'performance_metric',
      ...metric
    });
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export const usePerformanceTracking = (): PerformanceTracker => {
  const operationStartTimes = useRef<Map<string, number>>(new Map());

  const trackOperation = useCallback((operation: string, startTime: number, success: boolean, error?: string) => {
    performanceMonitor.trackOperation(operation, startTime, success, error);
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics[] => {
    return performanceMonitor.getMetrics();
  }, []);

  const clearMetrics = useCallback((): void => {
    performanceMonitor.clearMetrics();
  }, []);

  const getAverageResponseTime = useCallback((): number => {
    return performanceMonitor.getAverageResponseTime();
  }, []);

  const getSuccessRate = useCallback((): number => {
    return performanceMonitor.getSuccessRate();
  }, []);

  return {
    trackOperation,
    getMetrics,
    clearMetrics,
    getAverageResponseTime,
    getSuccessRate
  };
};

// Hook for tracking async operations
export const useAsyncOperationTracking = () => {
  const { trackOperation } = usePerformanceTracking();
  const operationStartTimes = useRef<Map<string, number>>(new Map());

  const trackAsyncOperation = useCallback(async <T>(
    operation: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    operationStartTimes.current.set(operation, startTime);

    try {
      const result = await asyncFunction();
      trackOperation(operation, startTime, true);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      trackOperation(operation, startTime, false, errorMessage);
      throw error;
    } finally {
      operationStartTimes.current.delete(operation);
    }
  }, [trackOperation]);

  return { trackAsyncOperation };
};

// Hook for tracking component render performance
export const useRenderTracking = (componentName: string) => {
  const { trackOperation } = usePerformanceTracking();
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    trackOperation(`${componentName}_render`, Date.now() - renderTime, true);
  });
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const { trackOperation } = usePerformanceTracking();

  const trackInteraction = useCallback((interaction: string, details?: any) => {
    const startTime = Date.now();
    
    // Track the interaction
    trackOperation(`user_interaction_${interaction}`, startTime, true);
    
    // Log additional details in development
    if (import.meta.env.DEV && details) {
      console.log(`User interaction: ${interaction}`, details);
    }
  }, [trackOperation]);

  return { trackInteraction };
};

// Performance monitoring component
export const PerformanceMonitorComponent: React.FC = () => {
  const { getMetrics, getAverageResponseTime, getSuccessRate } = usePerformanceTracking();

  useEffect(() => {
    if (import.meta.env.DEV) {
      const interval = setInterval(() => {
        const metrics = getMetrics();
        if (metrics.length > 0) {
          console.group('Performance Metrics');
          console.log(`Average Response Time: ${getAverageResponseTime().toFixed(2)}ms`);
          console.log(`Success Rate: ${getSuccessRate().toFixed(1)}%`);
          console.log(`Total Operations: ${metrics.length}`);
          console.groupEnd();
        }
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }
  }, [getMetrics, getAverageResponseTime, getSuccessRate]);

  return null; // This component doesn't render anything
}; 