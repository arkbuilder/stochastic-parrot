import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './db/migrate.js';
import { getDb } from './db/connection.js';
import { rateLimit } from './middleware/rate-limit.js';
import scoresRouter from './routes/scores.js';
import progressRouter from './routes/progress.js';
import eventsRouter from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client');

runMigrations();

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit);

const allowedOrigin = process.env.CORS_ORIGIN;
app.use((req, res, next) => {
  if (!allowedOrigin) {
    next();
    return;
  }

  const origin = req.header('origin');
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => {
  let db = 'disconnected';
  try {
    getDb().prepare('SELECT 1 as ok').get();
    db = 'connected';
  } catch {
    db = 'error';
  }

  res.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    db,
  });
});

app.use('/api/scores', scoresRouter);
app.use('/api/progress', progressRouter);
app.use('/api/events', eventsRouter);

app.use(
  express.static(clientDistPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
      }

      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }),
);

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(clientDistPath, 'index.html'));
});

const port = Number.parseInt(process.env.PORT ?? '8787', 10);
app.listen(port, () => {
  console.info(`[server] listening on http://localhost:${port}`);
});
