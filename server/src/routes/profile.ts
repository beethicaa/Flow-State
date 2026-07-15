import { Router, Request, Response } from 'express';
import { getDB } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = getDB();

function getProfile(deviceId: string): any {
  const stmt = db.prepare('SELECT * FROM profiles WHERE device_id = ?');
  return stmt.get(deviceId) as any;
}

function createProfile(deviceId: string): any {
  const stmt = db.prepare(`
    INSERT INTO profiles (device_id) VALUES (?)
  `);
  stmt.run(deviceId);
  return getProfile(deviceId);
}

router.get('/:deviceId', (req: Request, res: Response) => {
  try {
    let profile = getProfile(req.params.deviceId);
    if (!profile) {
      profile = createProfile(req.params.deviceId);
    }
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

router.put('/:deviceId', (req: Request, res: Response) => {
  try {
    const { xp, streak, last_played, games_played, skills, achievements, display_name, leaderboard_opt_in } = req.body;

    // Upsert: insert if missing, update if exists
    const stmt = db.prepare(`
      INSERT INTO profiles (device_id, display_name, xp, streak, last_played, games_played, skills, achievements, leaderboard_opt_in)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        display_name = COALESCE(excluded.display_name, profiles.display_name),
        xp = COALESCE(excluded.xp, profiles.xp),
        streak = COALESCE(excluded.streak, profiles.streak),
        last_played = COALESCE(excluded.last_played, profiles.last_played),
        games_played = COALESCE(excluded.games_played, profiles.games_played),
        skills = COALESCE(excluded.skills, profiles.skills),
        achievements = COALESCE(excluded.achievements, profiles.achievements),
        leaderboard_opt_in = COALESCE(excluded.leaderboard_opt_in, profiles.leaderboard_opt_in)
    `);

    stmt.run(
      req.params.deviceId,
      display_name || null,
      xp ?? 0,
      streak ?? 0,
      last_played || null,
      games_played ?? 0,
      skills || null,
      achievements ? JSON.stringify(achievements) : null,
      leaderboard_opt_in ?? 0
    );

    const profile = getProfile(req.params.deviceId);
    res.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export { router as profileRouter };