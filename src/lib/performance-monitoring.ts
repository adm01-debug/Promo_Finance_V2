// ============================================
// PERFORMANCE MONITORING: Monitoramento de desempenho
// Métricas, profiling e otimização
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================
// TIPOS
// ============================================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface RenderMetric {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  avgRenderTime: number;
  lastRenderTime: number;
  renders: number[];
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

// ============================================
// PERFORMANCE MONITOR SINGLETON
// ============================================

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private marks: Map<string, number> = new Map();
  private webVitals: WebVitals = {};
  private subscribers: Set<(metrics: PerformanceMetric) => void> = new Set();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  private constructor() {
    this.initWebVitals();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Habilitar/desabilitar monitoramento
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ============================================
  // MÉTRICAS GENÉRICAS
  // ============================================

  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Manter apenas últimas 100 métricas por tipo
    if (existing.length > 100) {
      existing.shift();
    }

    this.metrics.set(name, existing);
    this.notifySubscribers(metric);
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const all: PerformanceMetric[] = [];
    this.metrics.forEach((metrics) => all.push(...metrics));
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAverageMetric(name: string): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  // ============================================
  // TIMING MARKS
  // ============================================

  mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null;

    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (startTime === undefined) return null;

    const duration = endTime - startTime;
    this.recordMetric(name, duration, 'ms');

    return duration;
  }

  // ============================================
  // RENDER TRACKING
  // ============================================

  trackRender(componentName: string, renderTime: number): void {
    if (!this.enabled) return;

    const existing = this.renderMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      avgRenderTime: 0,
      lastRenderTime: 0,
      renders: [],
    };

    existing.renderCount++;
    existing.totalRenderTime += renderTime;
    existing.avgRenderTime = existing.totalRenderTime / existing.renderCount;
    existing.lastRenderTime = renderTime;
    existing.renders.push(renderTime);

    // Manter apenas últimos 50 renders
    if (existing.renders.length > 50) {
      existing.renders.shift();
    }

    this.renderMetrics.set(componentName, existing);
  }

  getRenderMetrics(componentName?: string): RenderMetric[] {
    if (componentName) {
      const metric = this.renderMetrics.get(componentName);
      return metric ? [metric] : [];
    }

    return Array.from(this.renderMetrics.values());
  }

  getSlowRenders(thresholdMs: number = 16): RenderMetric[] {
    return this.getRenderMetrics().filter(
      (m) => m.avgRenderTime > thresholdMs
    );
  }

  // ============================================
  // WEB VITALS
  // ============================================

  private initWebVitals(): void {
    if (typeof window === 'undefined') return;

    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      this.webVitals.LCP = lastEntry.startTime;
      this.recordMetric('LCP', lastEntry.startTime, 'ms');
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Browser não suporta
    }

    // FID - First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const fid = fidEntry.processingStart - fidEntry.startTime;
        this.webVitals.FID = fid;
        this.recordMetric('FID', fid, 'ms');
      });
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // Browser não suporta
    }

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
          this.webVitals.CLS = clsValue;
          this.recordMetric('CLS', clsValue, '');
        }
      });
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Browser não suporta
    }

    // FCP - First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.webVitals.FCP = entry.startTime;
          this.recordMetric('FCP', entry.startTime, 'ms');
        }
      });
    });

    try {
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Browser não suporta
    }

    // TTFB - Time to First Byte
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.webVitals.TTFB = nav.responseStart - nav.requestStart;
        this.recordMetric('TTFB', this.webVitals.TTFB, 'ms');
      }
    }
  }

  getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  // ============================================
  // MEMORY
  // ============================================

  getMemoryInfo(): MemoryInfo | null {
    const memory = (performance as Performance & { memory?: MemoryInfo }).memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  getMemoryUsagePercent(): number | null {
    const info = this.getMemoryInfo();
    if (!info) return null;

    return (info.usedJSHeapSize / info.jsHeapSizeLimit) * 100;
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================

  subscribe(callback: (metric: PerformanceMetric) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(metric: PerformanceMetric): void {
    this.subscribers.forEach((callback) => callback(metric));
  }

  // ============================================
  // REPORTING
  // ============================================

  generateReport(): {
    summary: Record<string, { avg: number; min: number; max: number; count: number }>;
    renderMetrics: RenderMetric[];
    webVitals: WebVitals;
    memory: MemoryInfo | null;
    slowRenders: RenderMetric[];
  } {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((metrics, name) => {
      const values = metrics.map((m) => m.value);
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });

    return {
      summary,
      renderMetrics: this.getRenderMetrics(),
      webVitals: this.getWebVitals(),
      memory: this.getMemoryInfo(),
      slowRenders: this.getSlowRenders(),
    };
  }

  clear(): void {
    this.metrics.clear();
    this.renderMetrics.clear();
    this.marks.clear();
  }
}

// Instância singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// ============================================
// HOOKS
// ============================================

/**
 * Hook para medir tempo de render
 */
export function useRenderTime(componentName: string): void {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    performanceMonitor.trackRender(componentName, renderTime);
    startTime.current = performance.now();
  });
}

/**
 * Hook para contar renders
 */
export function useRenderCount(componentName: string): number {
  const countRef = useRef(0);

  useEffect(() => {
    countRef.current++;
    performanceMonitor.recordMetric(
      `${componentName}_renders`,
      countRef.current,
      'count'
    );
  });

  return countRef.current;
}

/**
 * Hook para medir performance de efeito
 */
export function useEffectTiming(
  effectName: string,
  effect: () => void | (() => void),
  deps: unknown[]
): void {
  useEffect(() => {
    const start = performance.now();
    const cleanup = effect();
    const duration = performance.now() - start;

    performanceMonitor.recordMetric(`effect_${effectName}`, duration, 'ms');

    return () => {
      if (typeof cleanup === 'function') {
        const cleanupStart = performance.now();
        cleanup();
        const cleanupDuration = performance.now() - cleanupStart;
        performanceMonitor.recordMetric(
          `effect_${effectName}_cleanup`,
          cleanupDuration,
          'ms'
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook para monitorar performance
 */
export function usePerformanceMetrics(): {
  webVitals: WebVitals;
  memory: MemoryInfo | null;
  slowRenders: RenderMetric[];
  report: ReturnType<PerformanceMonitor['generateReport']> | null;
} {
  const [metrics, setMetrics] = useState<{
    webVitals: WebVitals;
    memory: MemoryInfo | null;
    slowRenders: RenderMetric[];
  }>({
    webVitals: {},
    memory: null,
    slowRenders: [],
  });

  useEffect(() => {
    const update = () => {
      setMetrics({
        webVitals: performanceMonitor.getWebVitals(),
        memory: performanceMonitor.getMemoryInfo(),
        slowRenders: performanceMonitor.getSlowRenders(),
      });
    };

    const unsubscribe = performanceMonitor.subscribe(update);
    update();

    return unsubscribe;
  }, []);

  return {
    ...metrics,
    report: performanceMonitor.generateReport(),
  };
}

/**
 * Hook para profiling de callback
 */
export function useProfiledCallback<T extends (...args: unknown[]) => unknown>(
  name: string,
  callback: T,
  deps: unknown[]
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = callbackRef.current(...args);
      const duration = performance.now() - start;

      performanceMonitor.recordMetric(`callback_${name}`, duration, 'ms');

      return result;
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}

/**
 * Hook para detectar rerenders desnecessários
 */
export function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T
): void {
  const prevPropsRef = useRef<T>();

  useEffect(() => {
    if (prevPropsRef.current) {
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      Object.keys({ ...prevPropsRef.current, ...props }).forEach((key) => {
        if (prevPropsRef.current![key] !== props[key]) {
          changedProps[key] = {
            from: prevPropsRef.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.group(`🔄 ${componentName} re-rendered`);
        console.log('Changed props:', changedProps);
        console.groupEnd();
      }
    }

    prevPropsRef.current = props;
  });
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Wrapper para medir tempo de função
 */
export function measureTime<T>(
  name: string,
  fn: () => T
): T {
  performanceMonitor.mark(`${name}_start`);
  const result = fn();
  const duration = performanceMonitor.measure(name, `${name}_start`);

  if (duration !== null && duration > 16) {
    console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (> 16ms frame budget)`);
  }

  return result;
}

/**
 * Wrapper async para medir tempo
 */
export async function measureTimeAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.mark(`${name}_start`);
  const result = await fn();
  const duration = performanceMonitor.measure(name, `${name}_start`);

  if (duration !== null && duration > 1000) {
    console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (> 1s)`);
  }

  return result;
}

/**
 * Decorator para medir métodos de classe
 */
export function Timed(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${(target as object).constructor?.name}.${propertyKey}`;

    descriptor.value = function (...args: unknown[]) {
      performanceMonitor.mark(`${metricName}_start`);
      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.measure(metricName, `${metricName}_start`);
        });
      }

      performanceMonitor.measure(metricName, `${metricName}_start`);
      return result;
    };

    return descriptor;
  };
}

/**
 * Verifica se performance está degradada
 */
export function isPerformanceDegraded(): boolean {
  const memory = performanceMonitor.getMemoryUsagePercent();
  const slowRenders = performanceMonitor.getSlowRenders();
  const webVitals = performanceMonitor.getWebVitals();

  // Memória > 80%
  if (memory && memory > 80) return true;

  // Muitos renders lentos
  if (slowRenders.length > 5) return true;

  // Web vitals ruins
  if (webVitals.LCP && webVitals.LCP > 2500) return true;
  if (webVitals.FID && webVitals.FID > 100) return true;
  if (webVitals.CLS && webVitals.CLS > 0.1) return true;

  return false;
}

// ============================================
// EXPORTS
// ============================================

export default {
  performanceMonitor,
  useRenderTime,
  useRenderCount,
  useEffectTiming,
  usePerformanceMetrics,
  useProfiledCallback,
  useWhyDidYouRender,
  measureTime,
  measureTimeAsync,
  Timed,
  isPerformanceDegraded,
};
