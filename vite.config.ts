import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * پیکربندی Vite برای انتشار روی GitHub Pages
 * -------------------------------------------------
 * نام ریپازیتوری: Marketer  →  basePath = /Marketer/
 * برای انتشار روی دامنه شخصی کافیست متغیر محیطی
 * PUBLIC_BASE را برابر "/" قرار دهید.
 */
const repoName = 'Marketer';
const base = process.env.PUBLIC_BASE ?? `/${repoName}/`;

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          pdf: ['jspdf', 'html2canvas'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // اجازه دسترسی میزبان‌های پیش‌نمایش آنلاین (sandbox / tunnel)
    allowedHosts: ['.e2b.app', '.trycloudflare.com', 'localhost', '.localhost'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.e2b.app', 'localhost', '.localhost'],
  },
});
