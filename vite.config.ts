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
    // Optimize bundle splitting for better caching and performance
    rollupOptions: {
      output: {
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
        },
      },
    },
    // Enable CSS code splitting for better performance
    cssCodeSplit: true,
    // Optimize assets - inline small assets to reduce requests
    assetsInlineLimit: 8192, // Inline assets < 8kb
    // Enable compression and optimization
    minify: 'esbuild',
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  // Optimize CSS processing
  css: {
    devSourcemap: mode === 'development',
  },
  // Add performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
