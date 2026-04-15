# lib/

- Owns shared domain logic used across UI, hooks, and API routes.
- `audioCore.ts`, `drumVoices.ts`, `audioEngine.ts`, and `synthEngine.ts` form the browser audio stack.
- `sequencer.ts` and `persistedMachineState.ts` define the pattern storage contracts.
- `producerCoach.ts`, `coachModels.ts`, and `freesound.ts` normalize what server routes and UI are allowed to exchange.
- Keep these modules framework-light. React state and Next.js routing concerns should stay outside this folder.
- If you change a stable contract here, update all consumers and document the change in `docs/architecture.md`.
