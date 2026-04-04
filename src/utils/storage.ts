const HIGH_SCORE_KEY = 'unicorn-runner-highscore';
const LEADERBOARD_KEY = 'unicorn-runner-leaderboard';
const PLAYER_KEY = 'unicorn-runner-player';
const PLAYER_COOKIE = 'unicorn-runner-player';
const MAX_LEADERBOARD_ENTRIES = 20;

// ── Cookie helpers (shared between browser & PWA contexts) ──

function setPlayerCookie(player: Player): void {
  try {
    const encoded = encodeURIComponent(JSON.stringify(player));
    // Cookie expires in 10 years
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${PLAYER_COOKIE}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // Cookie write failed — not critical
  }
}

function getPlayerFromCookie(): Player | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]+)`));
    if (!match) return null;
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Player;
    if (parsed && parsed.name && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function clearPlayerCookie(): void {
  document.cookie = `${PLAYER_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

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
    // Try localStorage first
    const raw = localStorage.getItem(PLAYER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Player;
      if (parsed && parsed.name && parsed.id) {
        // Ensure cookie is in sync
        setPlayerCookie(parsed);
        return parsed;
      }
    }
    // Fallback: restore from cookie (handles browser -> PWA migration)
    const cookiePlayer = getPlayerFromCookie();
    if (cookiePlayer) {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(cookiePlayer));
      return cookiePlayer;
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
  setPlayerCookie(player);
  return player;
}

export function clearPlayer(): void {
  localStorage.removeItem(PLAYER_KEY);
  clearPlayerCookie();
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
