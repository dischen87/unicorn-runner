/** Shared helpers for Cloudflare Pages Functions */

export interface Env {
  LEADERBOARD: KVNamespace;
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  playerId: string;
  score: number;
  level: number;
  unicorn: string;
  fartCount: number;
  date: string;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const TOP_SCORES_KEY = 'top-scores';
export const MAX_STORED_SCORES = 200;
export const MAX_SCORE_VALUE = 999_999;
export const MAX_LEVEL_VALUE = 99;
export const MAX_NAME_LENGTH = 30;
export const RATE_LIMIT_SECONDS = 5;

export function validateScoreEntry(body: unknown): { valid: true; entry: Omit<ScoreEntry, 'id' | 'date'> } | { valid: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.playerName !== 'string' || b.playerName.trim().length === 0 || b.playerName.length > MAX_NAME_LENGTH) {
    return { valid: false, message: 'playerName must be a non-empty string (max ' + MAX_NAME_LENGTH + ' chars)' };
  }
  if (typeof b.playerId !== 'string' || b.playerId.trim().length === 0) {
    return { valid: false, message: 'playerId must be a non-empty string' };
  }
  if (typeof b.score !== 'number' || !Number.isFinite(b.score) || b.score < 0 || b.score > MAX_SCORE_VALUE) {
    return { valid: false, message: 'score must be a number between 0 and ' + MAX_SCORE_VALUE };
  }
  if (typeof b.level !== 'number' || !Number.isFinite(b.level) || b.level < 1 || b.level > MAX_LEVEL_VALUE) {
    return { valid: false, message: 'level must be a number between 1 and ' + MAX_LEVEL_VALUE };
  }
  if (typeof b.unicorn !== 'string' || b.unicorn.trim().length === 0) {
    return { valid: false, message: 'unicorn must be a non-empty string' };
  }
  if (typeof b.fartCount !== 'number' || !Number.isFinite(b.fartCount) || b.fartCount < 0) {
    return { valid: false, message: 'fartCount must be a non-negative number' };
  }

  return {
    valid: true,
    entry: {
      playerName: b.playerName.trim(),
      playerId: b.playerId.trim(),
      score: Math.floor(b.score),
      level: Math.floor(b.level),
      unicorn: b.unicorn.trim(),
      fartCount: Math.floor(b.fartCount),
    },
  };
}
