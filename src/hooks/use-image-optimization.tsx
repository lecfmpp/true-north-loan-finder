import { useEffect, useRef, useState } from 'react';
import { createImageObserver, preloadImage } from '@/utils/image-utils';

interface UseImageOptimizationProps {
  src: string;
  priority?: boolean;
  lazy?: boolean;
}

export const useImageOptimization = ({ src, priority = false, lazy = true }: UseImageOptimizationProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Preload critical images
  useEffect(() => {
    if (priority) {
      preloadImage(src, true);
      setIsInView(true);
    }
  }, [src, priority]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || typeof window === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = createImageObserver((entry) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (observerRef.current && imgRef.current) {
          observerRef.current.unobserve(imgRef.current);
        }
      }
    });

    observerRef.current = observer;

    if (observer && imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return {
    imgRef,
    isLoaded,
    isInView,
    hasError,
    handleLoad,
    handleError,
  };
};