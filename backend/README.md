# Unicorn Runner — Online Leaderboard

Optional Cloudflare Workers backend for the online leaderboard.
The game works fully without this — all scores are saved locally by default.

## Setup

1. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```
   wrangler login
   ```

3. Create the KV namespace:
   ```
   wrangler kv:namespace create LEADERBOARD
   ```

4. Update `wrangler.toml` with the KV namespace ID from step 3:
   ```toml
   [[kv_namespaces]]
   binding = "LEADERBOARD"
   id = "your-actual-namespace-id"
   ```

5. Deploy:
   ```
   wrangler deploy
   ```

## Enable online mode in the game

In `src/services/LeaderboardService.ts`, set the API URL:

```typescript
private static API_URL = 'https://unicorn-runner-api.your-account.workers.dev/api';
```

Or call it at runtime:

```typescript
LeaderboardService.setApiUrl('https://unicorn-runner-api.your-account.workers.dev/api');
```

## API Endpoints

| Method | Path                      | Description                  |
|--------|---------------------------|------------------------------|
| GET    | /api/scores?limit=50      | Get top scores               |
| POST   | /api/scores               | Submit a new score           |
| GET    | /api/scores/player/:id    | Get scores for a player      |

## Local development

```
wrangler dev
```

This starts a local server at `http://localhost:8787`.
