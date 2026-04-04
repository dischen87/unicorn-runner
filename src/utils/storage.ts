const HIGH_SCORE_KEY = 'unicorn-runner-highscore';
const LEADERBOARD_KEY = 'unicorn-runner-leaderboard';
const PLAYER_KEY = 'unicorn-runner-player';
const MAX_LEADERBOARD_ENTRIES = 20;

// ── Player management ──

export interface Player {
  name: string;
  id: string;
  createdAt: string;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Player;
    if (parsed && parsed.name && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setPlayer(name: string): Player {
  const player: Player = {
    name: name.trim(),
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

export function clearPlayer(): void {
  localStorage.removeItem(PLAYER_KEY);
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  unicorn: string;
  level: number;
  date: string;
}

export function getHighScore(): number {
  const value = localStorage.getItem(HIGH_SCORE_KEY);
  if (value === null) {
    return 0;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function setHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, String(score));
}

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addToLeaderboard(entry: Omit<LeaderboardEntry, 'date'>): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    date: new Date().toISOString(),
  };
  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.score - a.score);
  const trimmed = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  return trimmed;
}
