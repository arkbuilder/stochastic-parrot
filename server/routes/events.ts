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

  const stmt = db.prepare(
    `INSERT INTO event_log (session_id, event_name, payload_json, payload_version, ts)
     VALUES (?, ?, ?, ?, ?)`,
  );

  db.exec('BEGIN');
  try {
    for (const event of body.events) {
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
