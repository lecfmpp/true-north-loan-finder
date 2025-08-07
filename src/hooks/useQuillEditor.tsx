import { useEffect, useState, forwardRef } from 'react';
import { lazy, Suspense } from 'react';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-custom.css';

// Lazy load ReactQuill to avoid SSR issues
const ReactQuillComponent = lazy(() => import('react-quill'));

const ReactQuillWrapper = forwardRef<any, any>((props, ref) => (
  <Suspense fallback={<div className="animate-pulse bg-muted h-96 rounded-md" />}>
    <ReactQuillComponent {...props} ref={ref} />
  </Suspense>
));

export const useQuillEditor = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading delay to ensure ReactQuill is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { ReactQuill: ReactQuillWrapper, isLoading };
};