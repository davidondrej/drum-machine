# Drum Machine

A neon browser drum machine with 16 drum lanes, an 8-step melody lane, save/load via Supabase, Freesound sample search, and an AI producer coach.

## Features
- 16 built-in drum voices generated with the Web Audio API.
- 8-step drum and melody sequencer with live preview and step recording.
- Freesound search and per-pad sample replacement.
- GitHub sign-in plus saved pattern library in Supabase.
- AI coach that critiques the visible pattern state through OpenRouter.
- PWA shell with manifest, icons, and service worker registration.

## Tech Stack
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase SSR/auth helpers
- Web Audio API

## Local Setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` into your local environment file.
3. Provide Supabase, OpenRouter, and Freesound credentials.
4. Apply the SQL files in `docs/` to your Supabase project.
5. Start the app with `npm run dev`.

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `OPENROUTER_API_KEY`
- `FREESOUND_API_KEY`
- `COACH_DAILY_LIMIT`
- `COACH_COOLDOWN_SECONDS`

## Documentation
- [Architecture](./docs/architecture.md)
- [Docs Folder Guide](./docs/AGENTS.md)
- [PWA Reference Notes](./docs/PWA-nextjs-docs.md)
- [Freesound Reference Notes](./docs/freesound-api-docs.md)

## Repo Map
- `app/`
  Next.js entrypoints, layout, manifest, auth callback, and API routes.
- `components/`
  Presentational UI for pads, sequencer, keyboard, controls, and coach panel.
- `hooks/`
  Runtime orchestration and server-backed state hooks.
- `lib/`
  Audio, sequencing, persistence, and LLM-facing domain logic.
- `utils/supabase/`
  Supabase client factories for browser, server, and middleware contexts.
- `docs/`
  Architecture docs, schema SQL, and vendor research notes.

## Important Runtime Flows
- Playback: `app/DrumMachine.tsx` -> `useDrumMachineState()` -> `lib/audioCore.ts`, `lib/drumVoices.ts`, and `lib/synthEngine.ts`
- Pattern storage: `usePatternLibrary()` -> Supabase `patterns` table
- Coach analysis: `buildMachineSnapshot()` -> `useProducerCoach()` -> `POST /api/coach` -> Supabase quota RPC -> OpenRouter
- Sample search: `components/FreesoundPanel.tsx` -> `GET /api/freesound` -> Freesound API

## Database Docs
- `docs/001_create_patterns_table.sql`
- `docs/002_create_coach_usage_table.sql`

When implementation changes these flows, update `docs/architecture.md` and the nearest local `AGENTS.md`.
