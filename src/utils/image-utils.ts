// Image optimization utilities for better performance
export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

// Generate responsive image srcset for different screen sizes
export const generateResponsiveSrcSet = (baseSrc: string, widths: number[] = [320, 640, 768, 1024, 1280, 1920]): string => {
  return widths
    .map(width => {
      // For Lovable uploads, we'll use the original image
      // In production, you'd generate different sizes
      return `${baseSrc} ${width}w`;
    })
    .join(', ');
};

// Generate sizes attribute for responsive images
export const generateSizesAttribute = (breakpoints?: { [key: string]: string }): string => {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
    'default': '25vw'
  };
  
  const sizes = breakpoints || defaultBreakpoints;
  const sizeEntries = Object.entries(sizes);
  
  return sizeEntries
    .map(([query, size], index) => {
      if (query === 'default' || index === sizeEntries.length - 1) {
        return size;
      }
      return `${query} ${size}`;
    })
    .join(', ');
};

// Check if WebP is supported
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Preload critical images
export const preloadImage = (src: string, priority: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = priority ? 'preload' : 'prefetch';
  link.as = 'image';
  link.href = src;
  
  if (priority) {
    link.setAttribute('fetchpriority', 'high');
  }
  
  document.head.appendChild(link);
};

// Lazy load image with intersection observer
export const createImageObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );
};