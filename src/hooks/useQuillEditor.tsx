import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-custom.css';

// Simplified hook that returns ReactQuill directly
export const useQuillEditor = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading delay to ensure styles are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return { ReactQuill, isLoading };
};