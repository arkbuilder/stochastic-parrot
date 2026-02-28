import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const scoreSchema = z.object({
  playerId: z.string().min(1),
  boardType: z.enum(['island', 'total', 'speed', 'accuracy']),
  islandId: z.string().optional(),
  score: z.number().int().nonnegative(),
  timeMs: z.number().int().nonnegative(),
  accuracyPct: z.number().min(0).max(100),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
  checksum: z.string().min(1),
});

router.get('/', (_req, res) => {
  const db = getDb();
  const top = db
    .prepare(
      `SELECT p.display_name as displayName, h.score, h.grade, h.time_ms as timeMs
       FROM highscores h
       JOIN players p ON p.id = h.player_id
       WHERE h.board_type = 'island' AND h.island_id = 'island_01'
       ORDER BY h.score DESC
       LIMIT 10`,
    )
    .all();

  res.json({ top10: top });
});

router.post('/', validateBody(scoreSchema), (req, res) => {
  const body = scoreSchema.parse(req.body);
  const db = getDb();

  db.prepare(
    `INSERT INTO highscores (player_id, board_type, island_id, score, time_ms, accuracy_pct, grade, checksum)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    body.playerId,
    body.boardType,
    body.islandId ?? null,
    body.score,
    body.timeMs,
    body.accuracyPct,
    body.grade,
    body.checksum,
  );

  res.status(201).json({ ok: true });
});

export default router;
