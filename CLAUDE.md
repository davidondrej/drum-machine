# Drum Machine Claude Notes

## Read Order
1. `README.md`
2. `docs/architecture.md`
3. The nearest folder `AGENTS.md`

## Current Architecture
- `app/DrumMachine.tsx` is the client shell that wires hooks to UI components.
- `hooks/useDrumMachineState.ts` owns playback timing, pad triggering, sample assignment, preview notes, and local persistence.
- `hooks/usePatternLibrary.ts` owns Supabase auth and CRUD for the `patterns` table.
- `hooks/useProducerCoach.ts` manages request lifecycle for `POST /api/coach`.
- `lib/` contains the stable contracts shared across UI, audio, persistence, and API routes.
- `app/api/coach/route.ts` authenticates the user, enforces quota with Supabase, and calls OpenRouter.
- `app/api/freesound/route.ts` proxies Freesound search and normalizes the response used by the UI.

## Files Requiring Extra Care
- `hooks/useDrumMachineState.ts`
- `lib/drumVoices.ts`
- `lib/synthEngine.ts`
- `lib/sequencer.ts`
- `lib/producerCoach.ts`
- `app/api/coach/route.ts`

## Project Rules
- `docs/architecture.md` is the canonical architecture document.
- Use targeted comments only. Avoid blanket JSDoc on trivial code.
- Keep SQL and RPC changes documented as numbered files in `docs/`.
- If the task is documentation-only, do not change runtime behavior.
- Do not run `npm run build` unless the user explicitly asks for it.
- Do not commit or push without the user's explicit permission.

## When You Change Something
- Update the nearest `AGENTS.md` if folder ownership or boundaries changed.
- Update `README.md` when setup, env vars, or user-facing features changed.
- Update `docs/architecture.md` when runtime flow or external integrations changed.
