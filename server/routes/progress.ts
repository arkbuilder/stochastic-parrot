import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const progressSchema = z.object({
  playerId: z.string().min(1),
  islandId: z.string().min(1),
  status: z.enum(['locked', 'unlocked', 'in_progress', 'completed']),
  bestGrade: z.enum(['S', 'A', 'B', 'C', 'D']).optional(),
  bestScore: z.number().int().nonnegative().default(0),
  chartFragment: z.number().int().min(0).max(1).default(0),
  expertBonus: z.number().int().min(0).max(1).default(0),
  attempts: z.number().int().nonnegative().default(0),
});

router.get('/', (req, res) => {
  const playerId = String(req.query.playerId ?? 'player_local');
  const db = getDb();

  const progress = db
    .prepare(
      `SELECT island_id as islandId, status, best_grade as bestGrade, best_score as bestScore,
              chart_fragment as chartFragment, expert_bonus as expertBonus, attempts
       FROM island_progress
       WHERE player_id = ?
       ORDER BY island_id ASC`,
    )
    .all(playerId);

  res.json({ progress });
});

router.post('/', validateBody(progressSchema), (req, res) => {
  const body = progressSchema.parse(req.body);
  const db = getDb();

  db.prepare(
    `INSERT INTO players (id, display_name)
     VALUES (?, ?)
     ON CONFLICT(id) DO NOTHING`,
  ).run(body.playerId, 'Pirate');

  db.prepare(
    `INSERT INTO island_progress (player_id, island_id, status, best_grade, best_score, chart_fragment, expert_bonus, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(player_id, island_id) DO UPDATE SET
       status = excluded.status,
       best_grade = excluded.best_grade,
       best_score = excluded.best_score,
       chart_fragment = excluded.chart_fragment,
       expert_bonus = excluded.expert_bonus,
       attempts = excluded.attempts,
       updated_at = datetime('now')`,
  ).run(
    body.playerId,
    body.islandId,
    body.status,
    body.bestGrade ?? null,
    body.bestScore,
    body.chartFragment,
    body.expertBonus,
    body.attempts,
  );

  res.status(201).json({ ok: true });
});

export default router;
