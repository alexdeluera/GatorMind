import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: If your app will be served from a sub-path (e.g., GitHub Pages)
  // base: '/my-app/',
  server: {
    // Optional: change dev server port or open browser automatically
    // port: 5173,
    // open: true,
    // Optional: proxy API calls to a backend during dev
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true
    //   }
    // }
  },
  // Optional build tweaks, usually not needed for a starter:
  // build: {
  //   sourcemap: true,
  //   outDir: 'dist'
  // }
});
