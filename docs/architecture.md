# Drum Machine Architecture

This document is the canonical description of how the current `drum-machine` implementation is wired.

## Product Scope
- Browser drum machine with 16 drum lanes and an 8-step melody lane.
- Optional saved patterns for signed-in users.
- Optional Freesound sample replacement for each drum pad.
- Optional AI coach that critiques the visible pattern state.

## Runtime Map

### Client Shell
- `app/page.tsx`
  Thin server entry that renders `app/DrumMachine.tsx`.
- `app/DrumMachine.tsx`
  Main client shell. Composes hooks and UI components, derives the coach snapshot, and passes state down.

### Hooks
- `hooks/useDrumMachineState.ts`
  Main orchestration hook for playback, local pattern state, sample assignment, note preview, and local storage.
- `hooks/usePatternLibrary.ts`
  Supabase auth and CRUD for saved patterns.
- `hooks/useProducerCoach.ts`
  Client-side request lifecycle for coach analysis.
- `hooks/useOnlineStatus.ts`
  Browser online/offline status.

### Shared Logic
- `lib/audioCore.ts`
  Singleton `AudioContext`, shared noise source, sample decode cache, and raw buffer playback.
- `lib/drumVoices.ts`
  Hand-tuned synthesized drum voices.
- `lib/synthEngine.ts`
  Shared synth bus plus per-note voice creation and release.
- `lib/audioEngine.ts`
  Stable drum-lane registry shared by the UI, playback, and coach snapshot.
- `lib/sequencer.ts`
  Empty pattern factories, pattern cloning, serialization, normalization, and event counting.
- `lib/persistedMachineState.ts`
  Local storage read/write for the current machine state.
- `lib/producerCoach.ts`
  Converts sequencer state into the snapshot and stats sent to the coach route.
- `lib/freesound.ts`
  Freesound response normalization helpers.
- `lib/music.ts`
  MIDI helpers and the keyboard layout metadata.

### Server Boundaries
- `app/api/coach/route.ts`
  Authenticated server route for coach analysis.
- `app/api/freesound/route.ts`
  Server proxy for Freesound search.
- `app/auth/callback/route.ts`
  OAuth callback that exchanges the Supabase auth code for a session.
- `utils/supabase/*`
  Browser, server, and middleware-specific Supabase client setup.

## Primary Data Flows

### 1. Playback
1. `app/DrumMachine.tsx` calls `useDrumMachineState()`.
2. The hook stores drum and melody patterns in React state and mirrors them into refs.
3. When playback is enabled, an interval advances the current step every half beat.
4. Each step triggers any active drum lanes through `DRUM_SOUNDS[index].playDefault()` or a loaded sample buffer.
5. Melody notes trigger `playSynthStep()` with the current waveform.

### 2. Local Persistence
1. On mount, `useDrumMachineState()` reads local storage through `readPersistedMachineState()`.
2. After hydration completes, changes to BPM, drum pattern, melody pattern, or synth waveform are written back through `writePersistedMachineState()`.
3. Corrupt local storage is discarded rather than blocking the app.

### 3. Saved Pattern Library
1. `usePatternLibrary()` creates a browser Supabase client.
2. The hook tracks auth session state and fetches rows from the `patterns` table for the current user.
3. Save and overwrite use `serializePattern()` so the persisted shape stays consistent.
4. Load uses `normalizePattern()` so older or malformed shapes degrade safely.

### 4. AI Coach
1. `app/DrumMachine.tsx` calls `buildMachineSnapshot()` from the live sequencer state.
2. `useProducerCoach()` POSTs the snapshot and selected model to `/api/coach`.
3. The route verifies auth with Supabase and enforces quota by calling `consume_coach_quota`.
4. The route forwards a constrained prompt to OpenRouter and expects strict JSON back.
5. The response is normalized before the UI renders feedback.

### 5. Freesound Search And Sample Assignment
1. `components/FreesoundPanel.tsx` calls `GET /api/freesound?query=...`.
2. The server route forwards the query to Freesound with the server-side API key.
3. The response is normalized into `FreesoundSound` records with usable preview URLs.
4. `useDrumMachineState()` loads the selected preview into an `AudioBuffer` and associates it with the selected pad.

### 6. Auth And Session Refresh
1. The browser client starts GitHub OAuth through Supabase.
2. Supabase redirects back to `app/auth/callback/route.ts`.
3. Middleware refreshes cookies so server routes can read the session reliably.

### 7. PWA Shell
1. `app/layout.tsx` registers the service worker through `components/ServiceWorkerRegistration.tsx`.
2. `app/manifest.ts` defines install metadata and icons.
3. `public/sw.js` precaches the shell and avoids caching `/api/*` and `/auth/*`.

## External Services
- Supabase
  Auth, saved patterns, coach quota tracking, and the `consume_coach_quota` RPC.
- OpenRouter
  LLM backend for the producer coach.
- Freesound
  Search API for sample previews.

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `OPENROUTER_API_KEY`
- `FREESOUND_API_KEY`
- `COACH_DAILY_LIMIT`
- `COACH_COOLDOWN_SECONDS`

## Stable Contracts
- `DRUM_SOUNDS` order is shared by the UI, playback, sample assignment, and coach snapshot logic.
- `NUM_STEPS` is currently `8` and is assumed by the UI layout and timing logic.
- Saved patterns use `serializePattern()` and `normalizePattern()` as the compatibility boundary.
- `MachineSnapshot` intentionally contains only visible sequencer state so the coach cannot claim audio details it does not have.
- `/api/freesound` returns `FreesoundSearchResponse`, not the raw vendor payload.

## Database Artifacts
- `docs/001_create_patterns_table.sql`
  Saved patterns table plus RLS policies.
- `docs/002_create_coach_usage_table.sql`
  Daily usage table and the `consume_coach_quota` RPC.

## Change Checklist
- UI composition changed: update the nearest `AGENTS.md` and this file if ownership moved.
- Audio behavior changed: verify `useDrumMachineState.ts`, `audioCore.ts`, `drumVoices.ts`, and `synthEngine.ts` still match this document.
- New integration or env var: update `.env.example`, `README.md`, and this file together.
- New schema or RPC: add a numbered SQL file in `docs/` and describe the flow here.
