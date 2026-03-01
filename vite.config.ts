import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import {
  existsSync,
  readFileSync,
  statSync,
  cpSync,
} from 'fs';

/** Serve the static marketing site under /aboutthegame/ in dev, copy it on build. */
function aboutTheGamePlugin(): Plugin {
  const root = resolve(__dirname, 'aboutthegame');
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff2': 'font/woff2',
  };
  return {
    name: 'serve-about-the-game',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/aboutthegame')) return next();
        let rel = req.url.replace('/aboutthegame', '') || '/index.html';
        if (rel === '/') rel = '/index.html';
        const file = resolve(root, '.' + rel);
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        const ext = rel.substring(rel.lastIndexOf('.'));
        res.setHeader(
          'Content-Type',
          mimeTypes[ext] || 'application/octet-stream',
        );
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      const out = resolve(__dirname, 'dist/client/aboutthegame');
      cpSync(root, out, { recursive: true });
    },
  };
}

export default defineConfig({
  root: 'src',
  publicDir: '../assets',
  plugins: [aboutTheGamePlugin()],
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
