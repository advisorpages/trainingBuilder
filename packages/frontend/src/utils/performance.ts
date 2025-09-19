import { memo, useMemo, useCallback } from 'react';

// Memoization utilities
export const createMemoComponent = <T extends object>(Component: React.ComponentType<T>) => {
  return memo(Component, (prevProps, nextProps) => {
    return Object.keys(prevProps).every(key =>
      prevProps[key as keyof T] === nextProps[key as keyof T]
    );
  });
};

// Image optimization
export const createOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality = 80
): string => {
  if (!url) return url;

  // If it's already optimized or a data URL, return as-is
  if (url.includes('w_') || url.startsWith('data:')) return url;

  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('f', 'auto');

  return url.includes('?')
    ? `${url}&${params.toString()}`
    : `${url}?${params.toString()}`;
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Performance measurement
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Memory optimization for large datasets
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Throttle function for performance-critical operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};