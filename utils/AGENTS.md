# utils/

- Owns small integration helpers that do not fit into the feature-oriented folders.
- In this project, `utils/supabase/` is the only active subtree and it owns Supabase client wiring for each runtime context.
- Keep utility modules narrow and side-effect-light. If a helper becomes feature-specific, move it closer to that feature.
