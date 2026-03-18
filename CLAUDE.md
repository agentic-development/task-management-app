# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Collaborative task management app (Trello-like). Single Next.js monolith serving both frontend and backend, deployed as a Docker container with SQLite persistence. Currently in the specification phase — feature charters define the full system before implementation begins.

## Tech Stack

- **Framework:** Next.js (App Router, Server Components + Client Components)
- **Language:** TypeScript
- **Database:** SQLite + Prisma ORM
- **Auth:** NextAuth (Auth.js) with Prisma adapter, session-based
- **UI:** Tailwind CSS + DaisyUI
- **State:** React Query (server state, polling, optimistic updates)
- **Testing:** Vitest (unit), Playwright (E2E)
- **Deployment:** Docker (self-hosted), SQLite file mounted as Docker volume

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

### Key Design Decisions

- **Fractional indexing** for list/card ordering — insert between positions without reindexing
- **Domain events** via typed in-process EventEmitter for cross-module communication
- **Prisma middleware** for automatic activity logging on mutations
- **React Query polling** (3-5s) for real-time updates; upgrade path to SSE
- **SQLite FTS5** for full-text search via `prisma.$queryRaw` (Prisma does not support FTS5 natively)
- **DaisyUI** chosen over shadcn/ui for pre-built card, modal, badge components with theme support

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

## Charter Reference

Detailed specifications live in `/charters/`. Each contains data models (Prisma schemas), REST API contracts, domain event schemas, and acceptance criteria.

| Charter | Covers |
|---------|--------|
| `task-management-app.md` | Product-level: scaffolding, search, polling, notifications |
| `user-management.md` | Auth, profiles, teams, roles, invitations |
| `task-boards.md` | Boards, lists, cards, labels, comments, activity feed |
