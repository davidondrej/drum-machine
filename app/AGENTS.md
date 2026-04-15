# app/

- Owns Next.js entrypoints, layout, manifest, auth callback wiring, and the top-level `DrumMachine` shell.
- `page.tsx` should stay thin. `DrumMachine.tsx` composes hooks and components but should not absorb low-level audio or API logic.
- `layout.tsx`, `manifest.ts`, and `public/sw.js` together define the PWA shell. Keep them aligned.
- `app/api/` has its own `AGENTS.md` because those routes are the server-only integration boundary.
- When adding a new route, provider, or app-level state boundary, update `docs/architecture.md`.
