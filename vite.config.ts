import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
