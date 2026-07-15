import { Router, Request, Response } from 'express';
import { getDB } from '../db.js';

const router = Router();
const db = getDB();

router.get('/', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'weekly';
    let dateFilter = '';

    if (period === 'weekly') {
      dateFilter = "AND created_at >= date('now', '-7 days')";
    } else if (period === 'daily') {
      dateFilter = "AND date(created_at) = date('now')";
    }

    const stmt = db.prepare(`
      SELECT p.device_id, p.display_name, SUM(e.amount) as xp_gained, COUNT(e.id) as games
      FROM xp_events e
      JOIN profiles p ON e.device_id = p.device_id
      WHERE p.leaderboard_opt_in = 1 ${dateFilter}
      GROUP BY p.device_id
      ORDER BY xp_gained DESC
      LIMIT 20
    `);

    const entries = stmt.all() as any[];
    res.json({ entries, period });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

export { router as leaderboardRouter };