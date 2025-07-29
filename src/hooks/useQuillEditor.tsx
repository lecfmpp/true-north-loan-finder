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
        
        // Handle different export patterns
        const QuillComponent = quillModule.default || quillModule;
        console.log('Loaded Quill component:', QuillComponent);
        
        if (QuillComponent && typeof QuillComponent === 'function') {
          setReactQuill(() => QuillComponent);
        } else {
          console.error('Invalid Quill component loaded:', QuillComponent);
        }
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