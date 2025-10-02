import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Setup proxy for API requests in development
  server: {
    port: 5173, // Frontend dev server port
    proxy: {
      // Proxy requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:5000', // Backend server address
        changeOrigin: true, // Needed for virtual hosting
        secure: false, // Set to true if your backend uses HTTPS
      },
    },
  },
});