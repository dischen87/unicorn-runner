/**
 * Unicorn Runner — Online Leaderboard API
 * Cloudflare Workers + KV backend
 *
 * Endpoints:
 *   GET  /api/scores?limit=50       — Top scores
 *   POST /api/scores                — Submit a new score
 *   GET  /api/scores/player/:id     — Scores for a specific player
 */

export interface Env {
  LEADERBOARD: KVNamespace;
}

interface ScoreEntry {
  id: string;
  playerName: string;
  playerId: string;
  score: number;
  level: number;
  unicorn: string;
  fartCount: number;
  date: string;
}

// --- Helpers ---

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// KV keys
const TOP_SCORES_KEY = 'top-scores';
const MAX_STORED_SCORES = 200;
const MAX_SCORE_VALUE = 999_999;
const MAX_LEVEL_VALUE = 99;
const MAX_NAME_LENGTH = 30;

// Rate limiting: max 1 submission per player per 5 seconds
const RATE_LIMIT_SECONDS = 5;

// --- Validation ---

function validateScoreEntry(body: unknown): { valid: true; entry: Omit<ScoreEntry, 'id' | 'date'> } | { valid: false; message: string } {
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

// --- Route handlers ---

async function getTopScores(env: Env, url: URL): Promise<Response> {
  const limitParam = url.searchParams.get('limit');
  let limit = 50;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 200) {
      limit = parsed;
    }
  }

  const raw = await env.LEADERBOARD.get(TOP_SCORES_KEY);
  if (!raw) {
    return json([]);
  }

  try {
    const scores: ScoreEntry[] = JSON.parse(raw);
    return json(scores.slice(0, limit));
  } catch {
    return json([]);
  }
}

async function submitScore(env: Env, request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body');
  }

  const validation = validateScoreEntry(body);
  if (!validation.valid) {
    return error(validation.message);
  }

  const { entry } = validation;

  // Rate limiting by playerId
  const rateLimitKey = 'rate:' + entry.playerId;
  const lastSubmit = await env.LEADERBOARD.get(rateLimitKey);
  if (lastSubmit) {
    return error('Too many submissions. Please wait a few seconds.', 429);
  }

  // Set rate limit flag (expires after RATE_LIMIT_SECONDS)
  await env.LEADERBOARD.put(rateLimitKey, '1', { expirationTtl: RATE_LIMIT_SECONDS });

  // Build the full entry
  const fullEntry: ScoreEntry = {
    ...entry,
    id: generateId(),
    date: new Date().toISOString(),
  };

  // Read existing scores, add the new one, sort, trim
  let scores: ScoreEntry[] = [];
  const raw = await env.LEADERBOARD.get(TOP_SCORES_KEY);
  if (raw) {
    try {
      scores = JSON.parse(raw);
    } catch {
      scores = [];
    }
  }

  scores.push(fullEntry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, MAX_STORED_SCORES);

  await env.LEADERBOARD.put(TOP_SCORES_KEY, JSON.stringify(scores));

  // Also store per-player scores
  const playerKey = 'player:' + entry.playerId;
  let playerScores: ScoreEntry[] = [];
  const playerRaw = await env.LEADERBOARD.get(playerKey);
  if (playerRaw) {
    try {
      playerScores = JSON.parse(playerRaw);
    } catch {
      playerScores = [];
    }
  }
  playerScores.push(fullEntry);
  playerScores.sort((a, b) => b.score - a.score);
  playerScores = playerScores.slice(0, 50);
  await env.LEADERBOARD.put(playerKey, JSON.stringify(playerScores));

  return json({ success: true, entry: fullEntry }, 201);
}

async function getPlayerScores(env: Env, playerId: string, url: URL): Promise<Response> {
  const limitParam = url.searchParams.get('limit');
  let limit = 20;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 50) {
      limit = parsed;
    }
  }

  const playerKey = 'player:' + playerId;
  const raw = await env.LEADERBOARD.get(playerKey);
  if (!raw) {
    return json([]);
  }

  try {
    const scores: ScoreEntry[] = JSON.parse(raw);
    return json(scores.slice(0, limit));
  } catch {
    return json([]);
  }
}

// --- Main router ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/scores
    if (request.method === 'GET' && path === '/api/scores') {
      return getTopScores(env, url);
    }

    // POST /api/scores
    if (request.method === 'POST' && path === '/api/scores') {
      return submitScore(env, request);
    }

    // GET /api/scores/player/:id
    const playerMatch = path.match(/^\/api\/scores\/player\/(.+)$/);
    if (request.method === 'GET' && playerMatch) {
      return getPlayerScores(env, decodeURIComponent(playerMatch[1]), url);
    }

    return error('Not found', 404);
  },
};
