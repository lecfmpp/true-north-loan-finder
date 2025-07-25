import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { trackWebVitals, checkPerformanceBudget, logBundleInfo } from './utils/performance'

const root = document.getElementById("root")!;

// Initialize performance monitoring
if (process.env.NODE_ENV === 'production') {
  trackWebVitals();
  
  // Check performance budget after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      checkPerformanceBudget();
    }, 1000);
  });
} else {
  // Development mode bundle analysis
  window.addEventListener('load', () => {
    logBundleInfo();
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
