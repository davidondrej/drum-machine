# components/

- Owns presentational UI for the drum machine shell.
- Components should prefer props over direct knowledge of persistence, auth, or Web Audio internals.
- Local browser-only behavior is acceptable when it is purely UI-facing, such as sample preview playback or click-away handling.
- If a component starts owning orchestration, move that logic into `hooks/` or `lib/`.
- Keep lane order, note labels, and other shared display contracts sourced from `lib/`, not duplicated locally.
