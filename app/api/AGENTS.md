# app/api/

- Owns server-only routes and secret-bearing integrations.
- `coach/route.ts` authenticates the user, enforces quota through Supabase, then calls OpenRouter.
- `freesound/route.ts` proxies Freesound search so the API key never reaches the browser.
- Keep request validation and normalized response shapes explicit. These routes are the compatibility boundary for the client.
- When adding or changing env vars, auth requirements, quota behavior, or vendor payload shaping, update `README.md` and `docs/architecture.md`.
