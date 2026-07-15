import { Router, Request, Response } from 'express';
import { getDB } from '../db.js';

const router = Router();
const db = getDB();

const MAX_ENTRIES = 50;

// GET /api/case-log/:deviceId?game=<optional>
router.get('/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const game = req.query.game as string | undefined;
    const params: any[] = [deviceId];
    let sql = `SELECT * FROM case_log WHERE device_id = ?`;
    if (game) {
      sql += ` AND game = ?`;
      params.push(game);
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`;
    const rows = db.prepare(sql).all(...params);
    res.json({ entries: rows });
  } catch (error) {
    console.error('Case log error:', error);
    res.status(500).json({ error: 'Failed to fetch case log.' });
  }
});

// POST /api/case-log
// Body: { device_id, game, scenario_summary, player_answer, judgment_score, debrief }
router.post('/', (req: Request, res: Response) => {
  try {
    const { device_id, game, scenario_summary, player_answer, judgment_score, debrief } = req.body;
    if (!device_id || !game) {
      return res.status(400).json({ error: 'Missing device_id or game' });
    }

    db.prepare(`
      INSERT INTO case_log (device_id, game, scenario_summary, player_answer, judgment_score, debrief)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(device_id, game, scenario_summary || '', player_answer || '', judgment_score || 0, debrief || '');

    // Prune to last 50 per device
    const count = db.prepare(`SELECT COUNT(*) as c FROM case_log WHERE device_id = ?`).get(device_id) as any;
    if (count.c > MAX_ENTRIES) {
      const excess = count.c - MAX_ENTRIES;
      const oldest = db.prepare(`
        SELECT id FROM case_log WHERE device_id = ? ORDER BY created_at ASC LIMIT ?
      `).all(device_id, excess) as any[];
      const ids = oldest.map((o: any) => o.id);
      db.prepare(`DELETE FROM case_log WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Case log post error:', error);
    res.status(500).json({ error: 'Failed to save case log.' });
  }
});

export { router as caseLogRouter };