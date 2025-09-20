// Performance monitoring and optimization utilities

// Core Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback for older browsers
      }

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any; // Cast for FID-specific properties
          if (fidEntry.processingStart) {
            console.log('FID:', fidEntry.processingStart - entry.startTime);
          }
        }
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Fallback for older browsers
      }

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any; // Cast for CLS-specific properties
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        }
        console.log('CLS:', clsValue);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Fallback for older browsers
      }
    }
  }
};

// Preload critical routes
export const preloadRoute = (routePath: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
};

// Image lazy loading intersection observer
export const createImageObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }
  return null;
};

// Bundle size analyzer (development only)
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    console.group('Bundle Analysis');
    scripts.forEach((script: any) => {
      if (script.src.includes('chunk')) {
        console.log('Chunk:', script.src.split('/').pop());
      }
    });
    console.groupEnd();
  }
};

// Resource timing API
export const analyzeResourceTiming = () => {
  if ('performance' in window && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter(resource => resource.duration > 1000);
    
    if (slowResources.length > 0) {
      console.warn('Slow resources detected:', slowResources.map(r => ({
        name: r.name,
        duration: Math.round(r.duration),
        type: r.initiatorType
      })));
    }
  }
};

// Performance budget check
export const checkPerformanceBudget = () => {
  if ('performance' in window && performance.timing) {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
    
    console.log('Performance Metrics:', {
      'Page Load Time': `${loadTime}ms`,
      'DOM Ready': `${domReady}ms`,
      'First Paint': performance.getEntriesByType('paint')[0]?.startTime + 'ms' || 'N/A'
    });
    
    // Performance budget alerts
    if (loadTime > 3000) {
      console.warn('⚠️ Page load time exceeds 3s budget:', loadTime + 'ms');
    }
    if (domReady > 1500) {
      console.warn('⚠️ DOM ready time exceeds 1.5s budget:', domReady + 'ms');
    }
  }
};

// Mobile performance optimization
export const optimizeForMobile = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === 'slow-2g') {
      // Reduce animations and heavy effects for slow connections
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
  }
};

// Critical resource preloading
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/src/index.css',
    '/src/assets/business-owner-hero.jpg'
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = resource.endsWith('.css') ? 'style' : 'image';
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Intersection Observer for lazy loading optimization
export const createOptimizedImageObserver = () => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }
  return null;
};