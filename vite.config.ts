import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensuring process.env.API_KEY is replaced during build with the value from environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Increased limit to acknowledge large visual libraries
    rollupOptions: {
      output: {
        // Manual chunking to separate Three.js from the main application logic
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('react') || id.includes('lucide-react')) {
              return 'vendor-core';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 3000
  }
});