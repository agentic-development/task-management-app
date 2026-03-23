# AGENTS.md

Generic agent instructions for this repository. Synced from `.context-index/constitution.md`.

## Project Overview

Task Management App is a collaborative, Trello-like task management application. It is a self-hosted Next.js monolith with SQLite persistence, deployed as a Docker container. The system supports teams, boards, lists, cards, labels, comments, and activity tracking with polling-based real-time updates.

## Non-Negotiable Principles

1. **TDD first** — Never write production code without a failing test first. Tests come from spec acceptance criteria.
2. **Migrations only** — All database changes require Prisma migrations. No raw DDL, no manual schema edits.
3. **Feature isolation** — Feature modules may not import from other features. Cross-feature communication goes through `shared/` or domain events.
4. **Fractional indexing** — List and card ordering uses fractional indices. Never reindex entire collections.
5. **Server Actions for mutations** — All in-app mutations use Server Actions, not Route Handlers (Route Handlers are reserved for public APIs and webhooks).

## Tech Stack

- **Framework:** Next.js (App Router, Server Components + Client Components)
- **Language:** TypeScript (strict mode)
- **Database:** SQLite + Prisma ORM
- **Auth:** NextAuth (Auth.js) with Prisma adapter, session-based
- **UI:** Tailwind CSS + DaisyUI
- **State:** React Query (server state, polling, optimistic updates)
- **Testing:** Vitest (unit), Playwright (E2E)
- **Deployment:** Docker (self-hosted), SQLite file mounted as Docker volume

## Coding Standards

- **Naming:** camelCase for variables/functions, PascalCase for components/types, kebab-case for file names
- **File structure:** Feature-based (`src/features/<feature>/{components,actions,queries}/`)
- **Import ordering:** Node builtins → external packages → shared → feature-local
- **Error handling:** Typed errors, never swallow exceptions silently
- **Components:** Server Components by default; `'use client'` only when interactivity or browser APIs are required

## Architecture Boundaries

### Requires Human Approval

- Adding new external dependencies
- Changing Prisma schema (new models, altered relations)
- Modifying authentication or authorization logic
- Altering public API contracts or domain event schemas

### Autonomous (Agent May Decide)

- Adding tests
- Refactoring within a module's boundaries
- Fixing lint or type errors
- Updating internal documentation

## Context Routing

| Context Need | Location |
|-------------|----------|
| Feature charters | `.context-index/specs/features/` |
| Platform context | `.context-index/platform-context.yaml` |
| Architecture orientation | `.context-index/orientation/architecture.md` |
| Database schema | `prisma/schema.prisma` |
| Shared utilities | `src/shared/lib/` |
| Feature modules | `src/features/<feature>/` |

## Quality Gates

```bash
npx vitest run        # Unit tests
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
npx playwright test   # E2E tests
```
