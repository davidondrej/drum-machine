# Drum Machine Agent Guide

## Start Here
1. Read `README.md` for setup, feature scope, and the repo map.
2. Read `docs/architecture.md` for the current runtime and data flow.
3. Read the closest local `AGENTS.md` before editing a folder.
4. Treat `docs/PWA-nextjs-docs.md` and `docs/freesound-api-docs.md` as reference material, not the canonical description of the current implementation.

## Project Snapshot
- Next.js 15 App Router app with React 19 and TypeScript.
- Browser-side audio engine built on the Web Audio API.
- Supabase handles GitHub auth, saved patterns, and coach quota tracking.
- OpenRouter powers the producer coach.
- Freesound is proxied through a server route for sample search.

## Canonical Docs
- `README.md`: onboarding, setup, and repo map.
- `docs/architecture.md`: canonical architecture and integration guide.
- `docs/*.sql`: schema and RPC changes in numbered order.
- Local `AGENTS.md` files: folder ownership and safe edit boundaries.

## Repo Map
- `app/`: Next.js entrypoints, layout, manifest, auth callback, and API routes.
- `components/`: UI building blocks used by the main drum machine shell.
- `hooks/`: state orchestration, Supabase pattern library, online status, and coach state.
- `lib/`: audio engine, pattern serialization, music helpers, Freesound transforms, and coach snapshot logic.
- `utils/supabase/`: browser, server, and middleware client factories.
- `docs/`: architecture doc, SQL migrations, and vendor/reference notes.

## High-Risk Files
- `hooks/useDrumMachineState.ts`: playback timing, audio triggering, local persistence, and sample assignment.
- `lib/drumVoices.ts`: hand-tuned synth drum voices with magic numbers.
- `lib/synthEngine.ts`: shared synth bus, voice layering, and release behavior.
- `lib/sequencer.ts`: saved-pattern contract and backward compatibility.
- `lib/producerCoach.ts`: snapshot contract that constrains what the LLM can claim.
- `app/api/coach/route.ts`: auth, quota RPC, OpenRouter call, and response normalization.

## Editing Rules
- Do not change business logic unless the user explicitly asks for it.
- Do not reorder `DRUM_SOUNDS` or change `NUM_STEPS` without auditing UI, snapshots, persistence, and docs together.
- Keep pattern persistence backward compatible through `serializePattern()` and `normalizePattern()`.
- Keep the coach honest: it can only reason about visible sequencer state, never rendered audio.
- Keep secrets server-only. Browser code should never read API keys directly.
- When changing Supabase schema or RPC behavior, add or update numbered SQL files in `docs/`.
- Do not run `npm run build` unless the user explicitly asks for it.
- Do not commit or push without the user's explicit permission.

## Documentation Definition Of Done
- New folder with meaningful ownership: add a local `AGENTS.md`.
- New non-trivial module: add a file header and comments around non-obvious behavior.
- New env var or third-party integration: update `README.md`, `docs/architecture.md`, and `.env.example`.
- New schema or RPC behavior: add a numbered SQL doc and update the architecture doc.
