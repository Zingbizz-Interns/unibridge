# UniBridge — Claude Instructions

## graphify (Knowledge Graph)

This project has a pre-built knowledge graph in `graphify-out/`. **Always query the graph before searching the codebase manually.**

### When to use graphify

Use `/graphify query "<question>"` instead of Grep/Glob/Read when:
- Exploring how a feature works end-to-end
- Finding which files are related to a concept
- Tracing data flow between layers (API → lib → DB schema)
- Understanding what a component or function connects to

### How to query

```
/graphify query "how does authentication work"
/graphify query "what connects the college profile to the admin verification flow"
/graphify path "CollegeSettingsClient" "getAuthenticatedCollege"
/graphify explain "getAuthenticatedCollege"
```

### When to update the graph

Run `/graphify . --update` after adding new files or significant new code so the graph stays current.

### When NOT to use graphify

- Reading a specific file you already know the path to → use Read directly
- Editing code → use Edit/Write directly
- Checking exact syntax → use Read directly

## Project Overview

UniBridge is a college discovery and admission platform for India.

- **Stack:** Next.js (App Router) · Neon PostgreSQL · Drizzle ORM · Cloudflare R2
- **User types:** Student · College · Admin
- **Key directories:**
  - `src/app/api/` — API routes (Next.js route handlers)
  - `src/lib/` — Business logic (query functions, auth helpers)
  - `src/db/schema/` — Drizzle ORM table definitions
  - `src/app/(protected)/` — Role-gated pages
  - `src/validators/` — Zod schemas for input validation
  - `src/components/` — Shared React components
  - `graphify-out/` — Knowledge graph outputs (graph.json, graph.html, GRAPH_REPORT.md)

## God Nodes (most connected — start here when exploring)

- `getAuthenticatedCollege()` — college auth guard used by every college API route
- `GET()` / `POST()` / `PATCH()` / `DELETE()` — route handlers (25, 20, 10, 8 edges)
- `CollegeSettingsClient.tsx` — college-side settings hub (9 edges)
- `formatDate()` — bridges student dashboard, admin queue, and college portal
