import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const eventSchema = z.object({
  sessionId: z.string().min(1),
  eventName: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  payloadVersion: z.number().int().positive().default(1),
  ts: z.string().optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1),
});

router.post('/', validateBody(batchSchema), (req, res) => {
  const body = batchSchema.parse(req.body);
  const db = getDb();
  const playerId = req.header('x-device-id') ?? 'player_local';

  db.prepare(
    `INSERT INTO players (id, display_name)
     VALUES (?, ?)
     ON CONFLICT(id) DO NOTHING`,
  ).run(playerId, 'Pirate');

  const stmt = db.prepare(
    `INSERT INTO event_log (session_id, event_name, payload_json, payload_version, ts)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const sessionStmt = db.prepare(
    `INSERT INTO sessions (id, player_id, input_mode, build_version)
     VALUES (?, ?, 'mixed', 'dev')
     ON CONFLICT(id) DO NOTHING`,
  );

  db.exec('BEGIN');
  try {
    for (const event of body.events) {
      sessionStmt.run(event.sessionId, playerId);
      stmt.run(
        event.sessionId,
        event.eventName,
        JSON.stringify(event.payload),
        event.payloadVersion,
        event.ts ?? new Date().toISOString(),
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  res.status(202).json({ accepted: body.events.length });
});

export default router;
