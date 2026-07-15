import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'flowstate.db'));

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      device_id TEXT PRIMARY KEY,
      display_name TEXT,
      xp INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_played TEXT,
      games_played INTEGER DEFAULT 0,
      skills TEXT DEFAULT '{"strategy":0,"execution":0,"analytics":0,"communication":0}',
      achievements TEXT DEFAULT '[]',
      leaderboard_opt_in INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      amount INTEGER,
      game TEXT,
      daily INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      game TEXT,
      scenario_summary TEXT,
      player_answer TEXT,
      judgment_score INTEGER,
      debrief TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS daily_challenge (
      date TEXT PRIMARY KEY,
      game TEXT,
      scenario_json TEXT
    );
  `);
}

export function getDB() {
  return db;
}