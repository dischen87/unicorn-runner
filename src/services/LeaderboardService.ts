const STORAGE_KEY = 'unicorn-runner-leaderboard-v2';
const MAX_LOCAL_ENTRIES = 100;

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  playerId: string;
  score: number;
  level: number;
  unicorn: string;
  fartCount: number;
  date: string;
}

export type NewScoreEntry = Omit<LeaderboardEntry, 'id' | 'date'>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getPlayerId(): string {
  const key = 'unicorn-runner-player-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'player-' + generateId();
    localStorage.setItem(key, id);
  }
  return id;
}

export class LeaderboardService {
  private static API_URL = ''; // Empty = local-only mode

  /** Submit a score — always saves locally, optionally sends to server */
  static async submitScore(entry: NewScoreEntry): Promise<void> {
    // Always save locally first
    this.saveLocal(entry);

    // If online mode is configured, also send to server
    if (this.API_URL) {
      try {
        await fetch(this.API_URL + '/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch {
        // Offline or server error — local save is the fallback
      }
    }
  }

  /** Get top scores — tries server first, falls back to local */
  static async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    if (this.API_URL) {
      try {
        const res = await fetch(this.API_URL + '/scores?limit=' + limit);
        if (res.ok) {
          const data: LeaderboardEntry[] = await res.json();
          return data;
        }
      } catch {
        // Fallback to local
      }
    }
    return this.getLocal(limit);
  }

  /** Get scores for a specific player */
  static async getPlayerScores(playerId: string, limit = 20): Promise<LeaderboardEntry[]> {
    if (this.API_URL) {
      try {
        const res = await fetch(this.API_URL + '/scores/player/' + encodeURIComponent(playerId) + '?limit=' + limit);
        if (res.ok) {
          const data: LeaderboardEntry[] = await res.json();
          return data;
        }
      } catch {
        // Fallback to local
      }
    }
    return this.getLocal(limit).filter(e => e.playerId === playerId);
  }

  /** Get the current player's unique ID */
  static getPlayerId(): string {
    return getPlayerId();
  }

  /** Set API URL for online mode */
  static setApiUrl(url: string): void {
    this.API_URL = url.replace(/\/+$/, ''); // strip trailing slashes
  }

  /** Check if online mode is active */
  static isOnline(): boolean {
    return this.API_URL.length > 0;
  }

  // --- Local storage methods ---

  private static saveLocal(entry: NewScoreEntry): void {
    const entries = this.getLocal(MAX_LOCAL_ENTRIES);
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: generateId(),
      date: new Date().toISOString(),
    };
    entries.push(newEntry);
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }

  private static getLocal(limit: number): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Migrate from old leaderboard format if present
        return this.migrateOldEntries(limit);
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return (parsed as LeaderboardEntry[])
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  /** Migrate entries from the old storage format (unicorn-runner-leaderboard) */
  private static migrateOldEntries(limit: number): LeaderboardEntry[] {
    try {
      const oldRaw = localStorage.getItem('unicorn-runner-leaderboard');
      if (!oldRaw) return [];
      const oldEntries = JSON.parse(oldRaw);
      if (!Array.isArray(oldEntries)) return [];

      const playerId = getPlayerId();
      const migrated: LeaderboardEntry[] = oldEntries.map((old: {
        name?: string;
        score?: number;
        unicorn?: string;
        level?: number;
        date?: string;
      }) => ({
        id: generateId(),
        playerName: old.name ?? 'Unbekannt',
        playerId,
        score: old.score ?? 0,
        level: old.level ?? 1,
        unicorn: old.unicorn ?? 'unicorn-pink',
        fartCount: 0,
        date: old.date ?? new Date().toISOString(),
      }));

      migrated.sort((a, b) => b.score - a.score);
      const trimmed = migrated.slice(0, MAX_LOCAL_ENTRIES);

      // Save in new format
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

      return trimmed.slice(0, limit);
    } catch {
      return [];
    }
  }
}
