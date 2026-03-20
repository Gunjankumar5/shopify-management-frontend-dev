import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
  ,
  build: {
    // Split dependencies into logical chunks to avoid very large single bundles
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
            if (id.includes('react-router-dom')) return 'vendor_router';
            if (id.includes('@supabase') || id.includes('supabase')) return 'vendor_supabase';
            if (id.includes('axios')) return 'vendor_axios';
            return 'vendor_misc';
          }
        }
      }
    },
    // raise warning threshold so small warnings don't fail CI; real fix is manualChunks above
    chunkSizeWarningLimit: 600
  }
});
