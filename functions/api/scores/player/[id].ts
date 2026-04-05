import { type Env, type ScoreEntry, CORS_HEADERS, json } from '../../_shared';

/** GET /api/scores/player/:id?limit=20 — Scores for a specific player */
export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  const playerId = decodeURIComponent(params.id as string);
  const url = new URL(request.url);
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
  if (!raw) return json([]);

  try {
    const scores: ScoreEntry[] = JSON.parse(raw);
    return json(scores.slice(0, limit));
  } catch {
    return json([]);
  }
};

/** OPTIONS — CORS preflight */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
