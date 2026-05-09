// Performance monitoring utility
export const performanceMonitor = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(`${name}-start`);
    }
  },

  end: (name: string) => {
    if (typeof window !== 'undefined' && window.performance?.mark && window.performance?.measure) {
      window.performance.mark(`${name}-end`);
      try {
        window.performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Measure might already exist
      }
    }
  },

  measure: (name: string, fn: () => void) => {
    performanceMonitor.start(name);
    const result = fn();
    performanceMonitor.end(name);
    return result;
  },

  getMetrics: () => {
    if (typeof window !== 'undefined' && window.performance?.getEntriesByType) {
      return window.performance.getEntriesByType('measure');
    }
    return [];
  }
};

// Basic performance tracking
export const trackWebVitals = () => {
  if (typeof window !== 'undefined') {
    // Track basic performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          console.log('Page Load Performance:', {
            'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP Connect': perfData.connectEnd - perfData.connectStart,
            'Server Response': perfData.responseStart - perfData.requestStart,
            'Page Load': perfData.loadEventEnd - perfData.navigationStart,
            'DOM Ready': perfData.domContentLoadedEventEnd - perfData.navigationStart,
          });
        }
      }, 0);
    });
  }
};