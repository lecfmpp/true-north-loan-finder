import React from 'react';
import { useImageOptimization } from '@/hooks/use-image-optimization';
import { generateResponsiveSrcSet, generateSizesAttribute } from '@/utils/image-utils';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fallback?: string;
  responsive?: boolean;
  sizes?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  fallback = '/placeholder.svg',
  responsive = true,
  sizes,
  ...props
}) => {
  const { imgRef, isLoaded, isInView, hasError, handleLoad, handleError } = useImageOptimization({
    src,
    priority,
    lazy: !priority,
  });

  // Generate responsive attributes
  const srcSet = responsive ? generateResponsiveSrcSet(src) : undefined;
  const sizesAttr = responsive ? (sizes || generateSizesAttribute()) : undefined;

  // Use fallback image if error occurred
  const imageSrc = hasError && fallback ? fallback : src;

  return (
    <div 
      className={cn("relative overflow-hidden", className)} 
      ref={imgRef}
      style={width && height ? { aspectRatio: `${width}/${height}` } : undefined}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          srcSet={srcSet}
          sizes={sizesAttr}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          className={cn(
            "transition-opacity duration-300 w-full h-full object-cover",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;