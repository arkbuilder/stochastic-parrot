import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { validateBody } from '../middleware/validate.js';
import { isValidScoreChecksum, type ScoreChecksumPayload } from '../security/score-checksum.js';

const router = Router();

const scoreSchema = z.object({
  playerId: z.string().min(1),
  boardType: z.enum(['island', 'total', 'speed', 'accuracy']),
  islandId: z.string().optional(),
  score: z.number().int().min(0).max(100_000),
  timeMs: z.number().int().min(0),
  accuracyPct: z.number().min(0).max(100),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
  checksum: z.string().min(8),
});

const querySchema = z.object({
  boardType: z.enum(['island', 'total', 'speed', 'accuracy']).default('island'),
  islandId: z.string().optional(),
  playerId: z.string().default('player_local'),
});

export function isGradeConsistent(score: number, grade: 'S' | 'A' | 'B' | 'C' | 'D'): boolean {
  if (score >= 1_200) {
    return grade === 'S' || grade === 'A';
  }
  if (score >= 900) {
    return grade === 'A' || grade === 'B';
  }
  if (score >= 600) {
    return grade === 'B' || grade === 'C';
  }
  if (score >= 300) {
    return grade === 'C' || grade === 'D';
  }
  return grade === 'D';
}

router.get('/', (req, res) => {
  const query = querySchema.parse(req.query);
  const db = getDb();

  const islandFilter = query.boardType === 'island' ? (query.islandId ?? 'island_01') : null;
  const orderBy =
    query.boardType === 'speed'
      ? 'h.time_ms ASC, h.score DESC'
      : query.boardType === 'accuracy'
        ? 'h.accuracy_pct DESC, h.time_ms ASC'
        : 'h.score DESC, h.time_ms ASC';

  const rankOrderBy =
    query.boardType === 'speed'
      ? 'h.time_ms ASC, h.score DESC'
      : query.boardType === 'accuracy'
        ? 'h.accuracy_pct DESC, h.time_ms ASC'
        : 'h.score DESC, h.time_ms ASC';

  const top = db
    .prepare(
      `SELECT p.id as playerId, p.display_name as displayName, h.score, h.grade, h.time_ms as timeMs
       FROM highscores h
       JOIN players p ON p.id = h.player_id
       WHERE h.board_type = ? AND (? IS NULL OR h.island_id = ?)
       ORDER BY ${orderBy}
       LIMIT 10`,
    )
    .all(query.boardType, islandFilter, islandFilter);

  const rankRow = db
    .prepare(
      `SELECT rank FROM (
         SELECT h.player_id as playerId,
            ROW_NUMBER() OVER (ORDER BY ${rankOrderBy}) as rank
         FROM highscores h
         WHERE h.board_type = ? AND (? IS NULL OR h.island_id = ?)
       ) ranked
       WHERE ranked.playerId = ?
       ORDER BY rank ASC
       LIMIT 1`,
    )
    .get(query.boardType, islandFilter, islandFilter, query.playerId) as { rank?: number } | undefined;

  res.json({ top10: top, playerRank: rankRow?.rank ?? null });
});

router.post('/', validateBody(scoreSchema), (req, res) => {
  const body = scoreSchema.parse(req.body);
  const db = getDb();

  const checksumPayload: ScoreChecksumPayload = {
    playerId: body.playerId,
    boardType: body.boardType,
    islandId: body.islandId,
    score: body.score,
    timeMs: body.timeMs,
    accuracyPct: body.accuracyPct,
    grade: body.grade,
  };

  if (!isValidScoreChecksum(checksumPayload, body.checksum)) {
    res.status(403).json({ error: 'Invalid score checksum' });
    return;
  }

  if (!isGradeConsistent(body.score, body.grade)) {
    res.status(422).json({ error: 'Score and grade are inconsistent' });
    return;
  }

  ensurePlayer(body.playerId);

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

function ensurePlayer(playerId: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO players (id, display_name)
     VALUES (?, ?)
     ON CONFLICT(id) DO NOTHING`,
  ).run(playerId, 'Pirate');
}

export default router;
