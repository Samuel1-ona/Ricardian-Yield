import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React and React Router
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Web3 libraries (Wagmi, Viem)
          'web3-vendor': ['wagmi', 'viem', '@tanstack/react-query'],
          // Chart library (Recharts)
          'charts-vendor': ['recharts'],
          // UI utilities
          'ui-vendor': ['react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly since we're splitting
  },
});

