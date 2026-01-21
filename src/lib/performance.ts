// Performance monitoring utilities for Finance-Hub

// Types
interface PerformanceMark {
  name: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceMeasure {
  name: string;
  startMark: string;
  endMark: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

interface ComponentRenderMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  timestamps: number[];
}

interface ApiMetrics {
  url: string;
  method: string;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errors: number;
}

// Performance Monitor Class
class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: PerformanceMeasure[] = [];
  private componentMetrics: Map<string, ComponentRenderMetrics> = new Map();
  private apiMetrics: Map<string, ApiMetrics> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Only enable in development or when explicitly enabled
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF === 'true';
  }

  // Enable/Disable monitoring
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Mark a point in time
  mark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const mark: PerformanceMark = {
      name,
      timestamp: performance.now(),
      metadata,
    };
    this.marks.set(name, mark);

    // Also use native Performance API if available
    if (typeof performance.mark === 'function') {
      try {
        performance.mark(name);
      } catch {
        // Ignore if mark already exists
      }
    }
  }

  // Measure time between two marks
  measure(name: string, startMark: string, endMark: string, metadata?: Record<string, unknown>): number {
    if (!this.enabled) return 0;

    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) {
      console.warn(`Performance: Missing mark(s) for measure "${name}"`);
      return 0;
    }

    const duration = end.timestamp - start.timestamp;

    const measure: PerformanceMeasure = {
      name,
      startMark,
      endMark,
      duration,
      metadata,
    };
    this.measures.push(measure);

    // Use native Performance API if available
    if (typeof performance.measure === 'function') {
      try {
        performance.measure(name, startMark, endMark);
      } catch {
        // Ignore errors
      }
    }

    return duration;
  }

  // Track component render
  trackRender(componentName: string, renderTime: number): void {
    if (!this.enabled) return;

    const existing = this.componentMetrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
      existing.timestamps.push(performance.now());
      
      // Keep only last 100 timestamps
      if (existing.timestamps.length > 100) {
        existing.timestamps.shift();
      }
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        timestamps: [performance.now()],
      });
    }
  }

  // Track API call
  trackApiCall(url: string, method: string, duration: number, isError: boolean = false): void {
    if (!this.enabled) return;

    const key = `${method}:${url}`;
    const existing = this.apiMetrics.get(key);

    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.averageTime = existing.totalTime / existing.count;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      if (isError) existing.errors++;
    } else {
      this.apiMetrics.set(key, {
        url,
        method,
        count: 1,
        totalTime: duration,
        averageTime: duration,
        minTime: duration,
        maxTime: duration,
        errors: isError ? 1 : 0,
      });
    }
  }

  // Get all metrics
  getMetrics(): {
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
    components: ComponentRenderMetrics[];
    api: ApiMetrics[];
  } {
    return {
      marks: Array.from(this.marks.values()),
      measures: this.measures,
      components: Array.from(this.componentMetrics.values()),
      api: Array.from(this.apiMetrics.values()),
    };
  }

  // Get component metrics
  getComponentMetrics(componentName?: string): ComponentRenderMetrics | ComponentRenderMetrics[] {
    if (componentName) {
      return this.componentMetrics.get(componentName) || {
        componentName,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        timestamps: [],
      };
    }
    return Array.from(this.componentMetrics.values());
  }

  // Get API metrics
  getApiMetrics(url?: string): ApiMetrics | ApiMetrics[] {
    if (url) {
      const metrics = Array.from(this.apiMetrics.values()).find((m) => m.url === url);
      return metrics || {
        url,
        method: 'GET',
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        errors: 0,
      };
    }
    return Array.from(this.apiMetrics.values());
  }

  // Get slow components (above threshold)
  getSlowComponents(thresholdMs: number = 16): ComponentRenderMetrics[] {
    return Array.from(this.componentMetrics.values()).filter(
      (m) => m.averageRenderTime > thresholdMs
    );
  }

  // Get slow API calls
  getSlowApiCalls(thresholdMs: number = 1000): ApiMetrics[] {
    return Array.from(this.apiMetrics.values()).filter(
      (m) => m.averageTime > thresholdMs
    );
  }

  // Clear all metrics
  clear(): void {
    this.marks.clear();
    this.measures = [];
    this.componentMetrics.clear();
    this.apiMetrics.clear();
    performance.clearMarks?.();
    performance.clearMeasures?.();
  }

  // Log summary to console
  logSummary(): void {
    if (!this.enabled) return;

    console.group('📊 Performance Summary');

    console.log('Component Renders:');
    console.table(
      Array.from(this.componentMetrics.values()).map((m) => ({
        Component: m.componentName,
        Renders: m.renderCount,
        'Avg Time (ms)': m.averageRenderTime.toFixed(2),
        'Last Time (ms)': m.lastRenderTime.toFixed(2),
      }))
    );

    console.log('API Calls:');
    console.table(
      Array.from(this.apiMetrics.values()).map((m) => ({
        Endpoint: `${m.method} ${m.url}`,
        Calls: m.count,
        'Avg Time (ms)': m.averageTime.toFixed(2),
        'Min (ms)': m.minTime.toFixed(2),
        'Max (ms)': m.maxTime.toFixed(2),
        Errors: m.errors,
      }))
    );

    console.groupEnd();
  }
}

// Create singleton instance
export const perfMonitor = new PerformanceMonitor();

// Helper functions
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  perfMonitor.mark(`${name}-start`);
  perfMonitor.mark(`${name}-end`);
  perfMonitor.measure(name, `${name}-start`, `${name}-end`);
  
  if (import.meta.env.DEV) {
    console.debug(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

export async function measureAsyncTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  perfMonitor.mark(`${name}-start`);
  perfMonitor.mark(`${name}-end`);
  perfMonitor.measure(name, `${name}-start`, `${name}-end`);
  
  if (import.meta.env.DEV) {
    console.debug(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

// React hook for tracking component renders
export function useRenderTracker(componentName: string): void {
  const startTime = performance.now();
  
  // Track render time on effect (after render completes)
  // Note: This is a simplified version - for accurate tracking, use React Profiler
  requestAnimationFrame(() => {
    const renderTime = performance.now() - startTime;
    perfMonitor.trackRender(componentName, renderTime);
  });
}

// Web Vitals tracking
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;

  // First Contentful Paint
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        perfMonitor.mark('FCP', { value: entry.startTime });
        console.debug(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
      }
    }
  });
  
  try {
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Browser doesn't support this
  }

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    perfMonitor.mark('LCP', { value: lastEntry.startTime });
    console.debug(`🖼️ LCP: ${lastEntry.startTime.toFixed(2)}ms`);
  });
  
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Browser doesn't support this
  }

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
      perfMonitor.mark('FID', { value: fid });
      console.debug(`⚡ FID: ${fid.toFixed(2)}ms`);
    }
  });
  
  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Browser doesn't support this
  }

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as LayoutShift).hadRecentInput) {
        clsValue += (entry as LayoutShift).value;
      }
    }
    perfMonitor.mark('CLS', { value: clsValue });
  });
  
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Browser doesn't support this
  }
}

// LayoutShift interface for TypeScript
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export default perfMonitor;
