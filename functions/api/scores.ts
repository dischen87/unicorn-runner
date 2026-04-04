import {
  type Env, type ScoreEntry,
  CORS_HEADERS, json, error, generateId, validateScoreEntry,
  TOP_SCORES_KEY, MAX_STORED_SCORES, RATE_LIMIT_SECONDS,
} from './_shared';

/** GET /api/scores?limit=50 — Top scores */
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  let limit = 50;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 200) {
      limit = parsed;
    }
  }

  const raw = await env.LEADERBOARD.get(TOP_SCORES_KEY);
  if (!raw) return json([]);

  try {
    const scores: ScoreEntry[] = JSON.parse(raw);
    return json(scores.slice(0, limit));
  } catch {
    return json([]);
  }
};

/** POST /api/scores — Submit a new score */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
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

  await env.LEADERBOARD.put(rateLimitKey, '1', { expirationTtl: RATE_LIMIT_SECONDS });

  const fullEntry: ScoreEntry = {
    ...entry,
    id: generateId(),
    date: new Date().toISOString(),
  };

  // Read existing scores, add the new one, sort, trim
  let scores: ScoreEntry[] = [];
  const raw = await env.LEADERBOARD.get(TOP_SCORES_KEY);
  if (raw) {
    try { scores = JSON.parse(raw); } catch { scores = []; }
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
    try { playerScores = JSON.parse(playerRaw); } catch { playerScores = []; }
  }
  playerScores.push(fullEntry);
  playerScores.sort((a, b) => b.score - a.score);
  playerScores = playerScores.slice(0, 50);
  await env.LEADERBOARD.put(playerKey, JSON.stringify(playerScores));

  return json({ success: true, entry: fullEntry }, 201);
};

/** OPTIONS /api/scores — CORS preflight */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
