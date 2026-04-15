# utils/supabase/

- `client.ts` creates the browser Supabase client.
- `server.ts` creates the server-side client backed by Next.js cookies.
- `middleware.ts` refreshes auth cookies so server routes can reliably read sessions.
- Keep runtime boundaries explicit. Browser code belongs in `client.ts`; request/cookie mutation belongs in `server.ts` or `middleware.ts`.
- If auth flow, cookie handling, or required env vars change, update `README.md` and `docs/architecture.md`.
