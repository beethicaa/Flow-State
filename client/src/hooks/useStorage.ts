import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'flowstate_profile';
const DEVICE_KEY = 'deviceId';
const PENDING_WRITES_KEY = 'flowstate_pending';

export interface Profile {
  version: number;
  xp: number;
  streak: number;
  lastPlayed: string | null;
  gamesPlayed: number;
  gamesPlayedByGame: Record<string, number>;
  skills: { strategy: number; execution: number; analytics: number; communication: number };
  achievements: string[];
  leaderboard_opt_in: number;
  display_name: string | null;
  updatedAt: string;
  recapBaseline: { xp: number; gamesPlayed: number; skills: Record<string, number>; snapshotAt: string } | null;
  lastRecapShown: string | null;
}

const DEFAULT_PROFILE: Profile = {
  version: 2,
  xp: 0,
  streak: 0,
  lastPlayed: null,
  gamesPlayed: 0,
  gamesPlayedByGame: {},
  skills: { strategy: 0, execution: 0, analytics: 0, communication: 0 },
  achievements: [],
  leaderboard_opt_in: 0,
  display_name: null,
  updatedAt: new Date().toISOString(),
  recapBaseline: null,
  lastRecapShown: null
};

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

interface UseStorageReturn {
  profile: Profile;
  deviceId: string;
  updateProfile: (updates: Partial<Profile>) => void;
  addXp: (amount: number, skill: keyof Profile['skills']) => void;
  playGame: (skill: keyof Profile['skills'], xpAwarded: number, gameId?: string) => void;
}

export interface CaseLogEntry {
  device_id: string;
  game: string;
  scenario_summary: string;
  player_answer: string;
  judgment_score: number;
  debrief: string;
}

export function logCase(entry: CaseLogEntry) {
  fetch('/api/case-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  }).catch(() => {});
}

export function useStorage(): UseStorageReturn {
  const deviceId = useRef(getDeviceId()).current;
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  // Boot: load local, then background-reconcile with backend
  useEffect(() => {
    // Local-first: load immediately
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.version === 1) {
            setProfile({ ...DEFAULT_PROFILE, ...parsed, version: 2, gamesPlayedByGame: parsed.gamesPlayedByGame || {}, recapBaseline: null, lastRecapShown: parsed.lastRecapShown || null });
          } else if (parsed.version === 2) {
            setProfile(parsed);
          }
        }
      }
    } catch {
      // corrupted — use default
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);

    // Background reconcile with backend
    fetch(`/api/profile/${deviceId}`, { headers: { 'x-device-id': deviceId } })
      .then(r => r.json())
      .then(data => {
        if (data?.profile) {
            const server: Profile = {
              version: 2,
              xp: data.profile.xp || 0,
              streak: data.profile.streak || 0,
              lastPlayed: data.profile.last_played || null,
              gamesPlayed: data.profile.games_played || 0,
              gamesPlayedByGame: data.profile.games_played_by_game || {},
              skills: data.profile.skills ? JSON.parse(typeof data.profile.skills === 'string' ? data.profile.skills : JSON.stringify(data.profile.skills)) : DEFAULT_PROFILE.skills,
              achievements: data.profile.achievements ? JSON.parse(typeof data.profile.achievements === 'string' ? data.profile.achievements : JSON.stringify(data.profile.achievements)) : [],
              leaderboard_opt_in: data.profile.leaderboard_opt_in || 0,
              display_name: data.profile.display_name || null,
              updatedAt: data.profile.updated_at || new Date().toISOString(),
              recapBaseline: null,
              lastRecapShown: null
            };
           setProfile(prev => {
             // Keep whichever has higher XP — a freshly-created empty backend profile 
             // can have a newer timestamp than real local progress
             if (server.xp > prev.xp) {
               return server;
             }
             return prev;
           });
        }
      })
      .catch(() => { /* offline — local state is fine */ });
  }, [deviceId]);

  // Persist to localStorage on change
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile, ready]);

  const syncToBackend = useCallback((p: Profile) => {
    const body = {
      xp: p.xp,
      streak: p.streak,
      last_played: p.lastPlayed,
      games_played: p.gamesPlayed,
      skills: JSON.stringify(p.skills),
      achievements: JSON.stringify(p.achievements)
    };

    fetch(`/api/profile/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
      body: JSON.stringify(body)
    }).catch(() => {
      // Queue for retry
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_WRITES_KEY) || '[]');
        pending.push(body);
        localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(pending));
      } catch {}
    });
  }, [deviceId]);

  // Flush pending writes on mount
  useEffect(() => {
    if (!ready) return;
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_WRITES_KEY) || '[]');
      if (pending.length > 0) {
        const latest = pending[pending.length - 1];
        fetch(`/api/profile/${deviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
          body: JSON.stringify(latest)
        }).then(() => localStorage.removeItem(PENDING_WRITES_KEY)).catch(() => {});
      }
    } catch {}
  }, [ready, deviceId]);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      syncToBackend(next);
      return next;
    });
  }, [syncToBackend]);

  const addXp = useCallback((amount: number, skill: keyof Profile['skills']) => {
    setProfile(prev => {
      const next = {
        ...prev,
        xp: prev.xp + amount,
        skills: { ...prev.skills, [skill]: (prev.skills[skill] || 0) + amount },
        updatedAt: new Date().toISOString()
      };
      syncToBackend(next);
      return next;
    });
  }, [syncToBackend]);

  const playGame = useCallback((skill: keyof Profile['skills'], xpAwarded: number, gameId?: string) => {
    setProfile(prev => {
      const today = new Date().toISOString().split('T')[0];
      const lastPlayed = prev.lastPlayed ? prev.lastPlayed.split('T')[0] : null;
      const newStreak = lastPlayed === today ? prev.streak : lastPlayed === getYesterday() ? prev.streak + 1 : 1;
      const next = {
        ...prev,
        xp: prev.xp + xpAwarded,
        streak: newStreak,
        lastPlayed: new Date().toISOString(),
        gamesPlayed: prev.gamesPlayed + 1,
        gamesPlayedByGame: { ...prev.gamesPlayedByGame, ...(gameId ? { [gameId]: (prev.gamesPlayedByGame[gameId] || 0) + 1 } : {}) },
        skills: { ...prev.skills, [skill]: (prev.skills[skill] || 0) + xpAwarded },
        updatedAt: new Date().toISOString()
      };
      syncToBackend(next);
      return next;
    });
  }, [syncToBackend]);

  return { profile, deviceId, updateProfile, addXp, playGame };
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}