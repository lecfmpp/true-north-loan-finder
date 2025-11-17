import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core dependencies
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Router
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            // UI components
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            // Heavy dependencies - load on demand
            if (id.includes('react-quill')) {
              return 'heavy-editor';
            }
            if (id.includes('recharts')) {
              return 'heavy-charts';
            }
            if (id.includes('jspdf')) {
              return 'heavy-pdf';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // All other node_modules
            return 'vendor-misc';
          }
          
          // App code splitting
          if (id.includes('/src/pages/Admin')) {
            return 'page-admin';
          }
          if (id.includes('/src/pages/') && !id.includes('Home')) {
            return 'pages';
          }
          if (id.includes('/src/components/admin/')) {
            return 'admin-components';
          }
        },
      },
    },
    // Enable CSS code splitting for better performance
    cssCodeSplit: true,
    // Optimize assets - inline small assets to reduce requests
    assetsInlineLimit: 4096, // Reduced for better mobile performance
    // Enable compression and optimization
    minify: 'esbuild',
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none', // Remove legal comments to reduce bundle size
    },
    // Target modern browsers for better optimization
    target: 'es2020',
    // Improve chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging in production
    sourcemap: mode === 'production' ? false : true,
  },
  // Optimize CSS processing
  css: {
    devSourcemap: mode === 'development',
  },
  // Add performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: ['@vite/client', '@vite/env'],
  },
}));
