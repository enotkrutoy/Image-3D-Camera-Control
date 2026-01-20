import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Shimming process.env for browser compatibility
    'process.env': process.env
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});