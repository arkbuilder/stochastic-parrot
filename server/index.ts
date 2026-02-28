import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './db/migrate.js';
import { rateLimit } from './middleware/rate-limit.js';
import scoresRouter from './routes/scores.js';
import progressRouter from './routes/progress.js';
import eventsRouter from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../dist/client');

runMigrations();

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/scores', scoresRouter);
app.use('/api/progress', progressRouter);
app.use('/api/events', eventsRouter);

app.use(express.static(clientDistPath));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(clientDistPath, 'index.html'));
});

const port = Number.parseInt(process.env.PORT ?? '8787', 10);
app.listen(port, () => {
  console.info(`[server] listening on http://localhost:${port}`);
});
