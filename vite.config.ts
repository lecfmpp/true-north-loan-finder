import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
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
    // Optimize bundle splitting for better caching and performance
    rollupOptions: {
      // Manual chunking is a browser-bundle concern. The SSR build is a single
      // Node module, and forcing these chunks on it breaks the build.
      output: isSsrBuild ? {} : {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // Router chunk
          router: ['react-router-dom'],
          // UI components chunk (keep smaller for faster loading)
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // Supabase chunk
          supabase: ['@supabase/supabase-js'],
          // Query chunk
          query: ['@tanstack/react-query'],
          // Form handling
          forms: ['react-hook-form'],
          // Rich text editor (heavy component) - load separately
          editor: ['react-quill'],
          // Charts (load on demand)
          charts: ['recharts'],
          // Lucide icons separate chunk
          icons: ['lucide-react'],
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
