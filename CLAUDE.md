# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- ===== CONSTITUTION (synced from .context-index/constitution.md by /adev-sync) ===== -->

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

### Patterns to Follow

- React Query for all client-side server state (fetching, caching, polling at 3-5s)
- Domain events via typed in-process EventEmitter for cross-module communication
- Prisma middleware for automatic activity logging on mutations
- DaisyUI components for UI — use built-in card, modal, badge, and theme support
- SQLite FTS5 via `prisma.$queryRaw` for full-text search

### Anti-Patterns to Avoid

- Direct cross-feature imports (use `shared/` or domain events instead)
- Raw SQL for schema changes (use Prisma migrations)
- Client Components where Server Components suffice
- Custom UI primitives when DaisyUI provides an equivalent
- Reindexing entire lists/cards instead of fractional index insertion

## Architecture Boundaries

### Requires Human Approval

- Adding new external dependencies
- Changing Prisma schema (new models, altered relations)
- Modifying authentication or authorization logic
- Altering public API contracts or domain event schemas
- Changing the build order or spec dependencies

### Autonomous (Agent May Decide)

- Adding tests
- Refactoring within a module's boundaries
- Fixing lint or type errors
- Updating internal documentation
- Implementing specs that follow the established build order

<!-- ===== END CONSTITUTION ===== -->

## Common Commands

```bash
npm run dev                          # Start Next.js dev server
npm run build                        # Production build
npm run lint                         # ESLint
npm run typecheck                    # TypeScript type checking
npx prisma migrate dev               # Run database migrations
npx prisma generate                  # Regenerate Prisma client after schema changes
npx prisma studio                    # Open database GUI
npx vitest                           # Unit tests (watch mode)
npx vitest run                       # Unit tests (single run)
npx vitest run src/features/boards   # Unit tests for a specific feature
npx playwright test                  # E2E tests
npx playwright test tests/boards.spec.ts --headed  # Single E2E test with browser
```

## Architecture

Single Next.js app in a Docker container. Server Components and API routes access SQLite through Prisma. Client Components use React Query for data fetching, cache invalidation, and polling-based real-time updates.

### Bounded Contexts

| Context | Entities | Owner |
|---------|----------|-------|
| Identity | User, Account, Session | User Management charter |
| Team | Team, Membership, Invitation | User Management charter |
| Board | Board, List, Label | Task Boards charter |
| Card | Card, CardLabel, Comment, ActivityEntry | Task Boards charter |
| Infrastructure | Notifications, Search Index | Product charter |

### Code Organization (feature-based)

```
src/
  app/                        # Next.js App Router routes and API handlers
  features/                   # Feature modules (auth, teams, boards, notifications)
    <feature>/components/     # Feature-specific UI
    <feature>/actions/        # Server actions
    <feature>/queries/        # Data fetching
  shared/
    lib/prisma.ts             # Prisma client singleton
    lib/auth.ts               # NextAuth config
    lib/events.ts             # Domain event emitter (typed, in-process)
    lib/search.ts             # SQLite FTS5 search utilities
    components/               # Shared layout and navigation
prisma/schema.prisma          # Database schema
```

### Build Order

Charters define a dependency-driven build sequence. Always consult the relevant charter before implementing a spec.

```
LS-FND-001 (Scaffolding)           ← must be first
  └─ LS-UM-001 (Auth)
       ├─ LS-UM-002 (User Profiles)      ← parallel
       ├─ LS-UM-003 (Teams)              ← parallel
       │    └─ LS-TB-001 (Board CRUD)
       │         ├─ LS-TB-002 (Lists)
       │         │    └─ LS-TB-003 (Cards)
       │         │         ├─ LS-TB-004 (Comments/Activity)
       │         │         └─ LS-FND-002 (Search)
       │         └─ LS-FND-003 (Polling)
       └─ LS-FND-004 (Notifications)     ← parallel after auth
```

## Context Routing

| Context Need | Location |
|-------------|----------|
| Feature charters | `charters/` and `.context-index/specs/features/` |
| Platform context | `.context-index/platform-context.yaml` |
| Architecture orientation | `.context-index/orientation/architecture.md` |
| API routes | `src/app/api/` |
| Database schema | `prisma/schema.prisma` |
| Shared utilities | `src/shared/lib/` |
| Shared components | `src/shared/components/` |
| Feature modules | `src/features/<feature>/` |
| Test utilities | `src/shared/test/` |
| Deployment | `Dockerfile`, `docker-compose.yml` |

## Development Workflow

**Methodology:** adev (TDD-first, brainstorm-before-code)
**Sandbox:** yes | **Execution:** subagent | **YOLO:** yes

### Implementing a Spec

For each Live Spec in the build order:

1. **Brainstorm first** — Run `/adev-brainstorm` to explore design decisions before writing code
2. **Specify** — Run `/adev-specify` to write the live spec if it doesn't exist
3. **Review specs** — Run `/adev-review-specs` before planning
4. **Plan** — Run `/adev-plan` to decompose into implementation tasks
5. **Implement** — Run `/adev-implement` (TDD: write tests first, then code)
6. **Validate** — Run `/adev-validate` for post-implementation checks
7. **Merge** — Merge the worktree or commit to the main branch

### Operational Notes

- Never write production code without a failing test first
- Use `/adev-debug` for systematic debugging (investigate root cause before proposing fixes)
- Subagent execution dispatches one agent per spec with isolated context

## Charter Reference

Detailed specifications live in `charters/` and `.context-index/specs/features/`.

| Charter | Covers |
|---------|--------|
| `task-management-app.md` | Product-level: scaffolding, search, polling, notifications |
| `user-management.md` | Auth, profiles, teams, roles, invitations |
| `task-boards.md` | Boards, lists, cards, labels, comments, activity feed |
