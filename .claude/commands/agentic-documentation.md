Analyze the entire codebase and make it fully optimized for AI agents. Follow these steps exactly:

1. Add canonical docs: `README.md`, `.env.example`, and `docs/architecture.md` so an agent can orient fast without reverse-engineering the repo. README should cover project purpose, feature list, local setup, run commands, and a short repo map. Architecture doc should explain actual data flows, external service integrations, and key state management patterns.

2. Replace generic root guidance with project-specific operational docs in `AGENTS.md` and `CLAUDE.md`. CLAUDE.md should contain operational rules, safe edit boundaries, and links to canonical docs. AGENTS.md should define agent workflow, change checklists, and a documentation definition-of-done.

3. Add local `AGENTS.md` files to every major folder so ownership, boundaries, and safe edit zones are documented where work happens. Each should state: what the folder owns, key files, inbound/outbound dependencies, and safe ways to change this folder.

4. Document the hardest runtime paths with targeted comments in hooks, lib, and API routes -- especially around audio, persistence, state orchestration, and AI/external-service flows. Focus on non-obvious behavior: magic numbers, envelope shapes, cache strategies, serialization versioning, quota enforcement, and intentional design constraints. Do NOT blanket-JSDoc everything -- only comment what is not self-evident.

5. Add maintenance rules so docs stay current: new integrations, schema changes, env vars, and non-trivial modules now have explicit documentation expectations. Define this in root AGENTS.md as a documentation definition-of-done.

Before starting, read the existing CLAUDE.md, AGENTS.md, README.md, and any docs/ files to understand what already exists. Do not duplicate or contradict existing documentation -- extend it.
