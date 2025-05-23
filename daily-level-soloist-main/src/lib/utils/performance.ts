// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  start(name: string): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measure<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    this.start(name);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  clear(): void {
    this.metrics.clear();
  }

  logSummary(): void {
    if (!this.isEnabled) return;

    const metrics = this.getMetrics();
    if (metrics.length === 0) return;

    console.group('Performance Summary');
    metrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(metric => {
        console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`);
      });
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render times
export function usePerformanceMonitor(componentName: string) {
  const start = () => performanceMonitor.start(`${componentName}-render`);
  const end = () => performanceMonitor.end(`${componentName}-render`);

  return { start, end };
}

// Decorator for measuring function execution time
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    return performanceMonitor.measure(`${target.constructor.name}.${propertyName}`, () => {
      return method.apply(this, args);
    });
  };

  return descriptor;
}

// Utility to detect memory leaks
export function detectMemoryLeaks() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  // Type assertion for memory property which is Chrome-specific
  const performance = window.performance as any;
  if (!performance.memory) {
    return null;
  }

  const memory = performance.memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
}

// Utility to throttle expensive operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Utility to debounce expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
