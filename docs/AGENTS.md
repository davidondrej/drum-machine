# docs/

- `architecture.md` is the canonical description of the current implementation.
- `001_*.sql`, `002_*.sql`, and later numbered files document schema and RPC changes in execution order.
- `PWA-nextjs-docs.md` and `freesound-api-docs.md` are reference material gathered during implementation. They are useful context, but they may contain options the live code does not use.
- When runtime behavior, external integrations, or schema changes, update `architecture.md` in the same pass.
- Keep SQL docs additive, numbered, and descriptive. Do not hide schema changes in chat-only instructions.
