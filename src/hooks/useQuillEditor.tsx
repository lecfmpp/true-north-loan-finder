import { useEffect, useState } from 'react';

// Custom hook to lazy load ReactQuill and its styles
export const useQuillEditor = () => {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuill = async () => {
      try {
        // Dynamically import ReactQuill and its CSS only when needed
        const [quillModule] = await Promise.all([
          import('react-quill'),
          import('react-quill/dist/quill.snow.css'),
          import('../styles/quill-custom.css')
        ]);
        
        setReactQuill(quillModule.default);
      } catch (error) {
        console.error('Failed to load Quill editor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuill();
  }, []);

  return { ReactQuill, isLoading };
};