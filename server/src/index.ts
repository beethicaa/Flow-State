import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db.js';
import { generateRouter } from './routes/generate.js';
import { profileRouter } from './routes/profile.js';
import { dailyRouter } from './routes/daily.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { caseLogRouter } from './routes/caselog.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/generate', rateLimiter, generateRouter);
app.use('/api/profile', profileRouter);
app.use('/api/daily-challenge', dailyRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/case-log', caseLogRouter);

// Serve built frontend in production
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initDB();
});
