# hooks/

- Owns stateful orchestration for playback, saved patterns, online status, and coach requests.
- `useDrumMachineState.ts` is the main runtime coordinator. Changes here can affect playback timing, persistence, and sample assignment at once.
- `usePatternLibrary.ts` is the only hook that should talk directly to the saved-pattern Supabase table.
- `useProducerCoach.ts` owns request lifecycle and stale/loading state for the coach UI. Keep transport details out of components.
- When hook responsibilities move, update `docs/architecture.md` and the nearest component or app docs.
