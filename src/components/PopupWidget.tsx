import { useEffect } from 'react';

const PopupWidget = () => {
  useEffect(() => {
    // Set a 5-second delay before loading the widget
    const timer = setTimeout(() => {
      // Load widget script dynamically
      const script = document.createElement('script');
      script.src = 'https://c0f0ed44-7810-4c94-979a-4e4fa01f26af.lovableproject.com/widget.js';
      script.setAttribute('data-widget-id', 'ca501164-4ae2-4ca7-83a6-c15a39a5f599');
      script.setAttribute('data-api-endpoint', 'https://kirxroqeoyncnsfdllra.supabase.co');
      script.setAttribute('data-position', 'bottom-right');
      script.setAttribute('data-website-id', '87bccb9d-4d39-4664-af8e-4ab4e966123c');
      script.async = true;
      
      document.head.appendChild(script);
    }, 5000); // 5 second delay

    return () => {
      // Clear the timer if component unmounts before script loads
      clearTimeout(timer);
      
      // Clean up script if it was added
      const existingScript = document.querySelector('script[src="https://c0f0ed44-7810-4c94-979a-4e4fa01f26af.lovableproject.com/widget.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default PopupWidget;