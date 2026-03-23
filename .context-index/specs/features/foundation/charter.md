# Product Charter: Task Management App

**Quarter:** 2026-Q1
**Status:** draft
**Blueprint:** task-management (`/Users/dpavancini/Development/agentic-dev-content/blueprints/task-management/blueprint.md`)
**Author:** @dpavancini
**Created:** 2026-03-18
**Updated:** 2026-03-18

---

## 1. Business Intent

### Problem Statement

Teams need a collaborative tool to organize work visually using boards, lists, and cards. Current workarounds (spreadsheets, chat threads, email) lead to missed deadlines, duplicated effort, and poor visibility into team progress. This charter defines the shared product foundation that the User Management and Task Boards modules build upon.

### Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| Weekly active teams | N/A (new product) | 10 teams within first month of launch | Activity log analysis |
| Availability | N/A | 99.9% during business hours | Uptime monitoring |
| Board load time | N/A | Under 500ms for boards with up to 500 cards | Performance monitoring |
| Concurrent users per board | N/A | 50 simultaneous users | Load testing |

### Stakeholder Map

| Stakeholder | Role | Interest | Communication Cadence |
|-------------|------|----------|-----------------------|
| End Users | Primary consumers | Reliable, fast task management | On-demand |
| Team Leads | Power users | Team visibility, board organization | Weekly |
| Organization Admins | Governance | Security, access control, data retention | Monthly |
| DevOps / Infrastructure | Platform maintainer | Deployability, observability, cost | On-demand |

---

## 2. Scope and Boundaries

### In Scope (Product Foundation)

- Project scaffolding (Next.js app, TypeScript config, ESLint, Prettier)
- Database setup (SQLite + Prisma, base schema, migration workflow)
- Authentication foundation (NextAuth configuration, Prisma adapter)
- Shared UI foundation (Tailwind CSS + DaisyUI setup, layout components)
- Real-time update infrastructure (polling or Server-Sent Events for board synchronization)
- Full-text search across boards, cards, and comments
- Activity logging middleware (Prisma middleware for audit trail)
- Notification system foundation (in-app notifications for assignments, mentions, due dates)
- Docker configuration for self-hosted deployment
- CI pipeline (lint, type-check, unit tests, E2E tests)

### Out of Scope

- File attachments
- Workflow automation rules
- Calendar or timeline views
- Billing and subscription management
- SSO and SAML
- Email notification delivery (in-app only for v1)

### Adjacent Systems

| System | Interaction | Owner |
|--------|-------------|-------|
| Email service (future) | Will consume notification events for email delivery | Not yet chartered |
| Reverse proxy (Nginx/Caddy) | Sits in front of the Docker container for TLS termination | Infrastructure |

---

## 3. Architectural Vision

### System Architecture Overview

A single Next.js application deployed as a Docker container. The application serves both the frontend (React Server Components + Client Components) and the backend (API routes). SQLite provides persistence via a single database file mounted as a Docker volume.

```
┌─────────────────────────────────────────────┐
│  Docker Container                           │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js Application                  │  │
│  │  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │ Server      │  │ API Routes    │  │  │
│  │  │ Components  │  │ /api/*        │  │  │
│  │  └──────┬──────┘  └───────┬───────┘  │  │
│  │         │                  │          │  │
│  │  ┌──────┴──────────────────┴───────┐  │  │
│  │  │  Prisma Client                  │  │  │
│  │  └──────────────┬──────────────────┘  │  │
│  │                 │                     │  │
│  │  ┌──────────────┴──────────────────┐  │  │
│  │  │  SQLite (volume-mounted)        │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Bounded Contexts

| Context | Entities | Owner Charter |
|---------|----------|---------------|
| Identity | User, Account, Session | User Management |
| Team | Team, Membership, Invitation | User Management |
| Board | Board, List, Label | Task Boards |
| Card | Card, CardLabel, Comment, ActivityEntry | Task Boards |
| Shared Infrastructure | Database, Auth, Layout, Notifications, Search | This charter |

### Cross-Cutting Architectural Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Architecture | Monolith (single Next.js app) | Two modules with shared database; microservices add deployment and consistency overhead without benefit at this scale | Separate frontend/backend (unnecessary split), microservices (premature) |
| Language | TypeScript (Node.js) | Type safety across frontend and backend; single language reduces context switching | JavaScript (no type safety), Go/Python (separate backend language) |
| Framework | Next.js (App Router) | Server Components reduce client JS; API routes eliminate need for separate backend; file-system routing | Remix (less mature SSR story), Express + React SPA (two codebases) |
| Database | SQLite with Docker volume | Zero-dependency database; single file simplifies backup, restore, and deployment; sufficient for target scale (50 concurrent users per board) | PostgreSQL (adds a separate container and connection management), Supabase (external dependency) |
| ORM | Prisma | Type-safe queries, built-in migrations, NextAuth adapter support; single ORM reduces cognitive overhead | Drizzle (lighter but less mature ecosystem), raw SQL (no type safety) |
| Auth | NextAuth (session-based) | Framework integration, Prisma adapter, credential + OAuth providers out of the box | Clerk (external dependency), custom JWT (more work) |
| Hosting | Self-hosted (Docker) | Full control, no vendor lock-in, predictable costs | Vercel (serverless, SQLite incompatible), Railway (PaaS dependency) |
| UI | Tailwind CSS + DaisyUI | Pre-built card, modal, badge, and dropdown components reduce custom CSS; theme system enables dark mode for free | Headless UI + custom styles (more work), shadcn/ui (requires more assembly) |
| State Management | React Query (server-components-first) | Handles cache invalidation, optimistic updates, and polling; avoids manual state management for server data | SWR (similar but less feature-rich), Redux (overkill for server-state syncing) |
| File Structure | Feature-based | Co-locates components, API routes, types, and hooks per feature; reduces cross-directory navigation | Layer-based (scatters related code across /components, /api, /lib) |
| API Style | REST | Simple, well-understood; no GraphQL overhead for a two-module monolith | GraphQL (over-engineered), tRPC (tighter coupling) |
| Testing | Vitest (unit) + Playwright (E2E) | Vitest is fast and Vite-native; Playwright handles cross-browser E2E | Jest (slower), Cypress (heavier) |

### Project Structure

```
src/
  app/
    layout.tsx              # Root layout with providers
    page.tsx                # Landing / dashboard
    api/
      auth/[...nextauth]/   # NextAuth route handler
      boards/               # Board API routes
      teams/                # Team API routes
      users/                # User API routes
  features/
    auth/                   # Login, register, session components
    teams/                  # Team management UI
    boards/                 # Board, list, card UI
    notifications/          # In-app notification components
  shared/
    components/             # Layout, navigation, shared UI
    lib/
      prisma.ts             # Prisma client singleton
      auth.ts               # NextAuth config and helpers
      events.ts             # Domain event emitter
      search.ts             # Full-text search utilities
  types/                    # Shared TypeScript types and event schemas
prisma/
  schema.prisma             # Full database schema
  migrations/               # Migration files
```

### Cross-Cutting Concern Strategies

**Activity Logging**
- **Approach:** Prisma middleware intercepts create, update, and delete operations on Board, List, Card, Comment, and Label models to automatically produce ActivityEntry records.
- **Libraries:** Prisma middleware API
- **Integration Points:** All modules that mutate tracked entities; Task Boards reads activity for board and card feeds

**Real-Time Updates**
- **Approach:** React Query polling with a short interval (3-5 seconds) for boards with active viewers. The polling endpoint returns a board version hash; React Query only refetches full data when the hash changes, minimizing bandwidth.
- **Libraries:** @tanstack/react-query
- **Integration Points:** Task Boards board view; polling endpoint at `GET /api/boards/:id/poll`
- **Upgrade Path:** Replace polling with Server-Sent Events (SSE) via a Next.js API route. No client-side changes needed beyond swapping the data source in the React Query hook.

**Search**
- **Approach:** SQLite FTS5 (full-text search extension) for searching across board names, card titles, card descriptions, and comments. Prisma does not natively support FTS5, so search queries use `prisma.$queryRaw` with parameterized SQL. A dedicated search index table is populated via Prisma middleware on card and comment mutations.
- **Libraries:** SQLite FTS5, Prisma `$queryRaw`
- **Integration Points:** All modules that create or update searchable content; search API route at `GET /api/search`

**Notifications**
- **Approach:** In-app notifications stored in a `Notification` model. Created by subscribing to domain events (card.assigned, card.commented, card.due_date_approaching). Displayed via a notification dropdown in the top navigation bar. Notifications are marked as read/unread per user.
- **Libraries:** Custom typed EventEmitter (domain event bus)
- **Integration Points:** User Management (notification ownership), Task Boards (event sources)

---

## 4. Decomposition Map

### Foundation Live Specs

| ID | Live Spec Title | Status | Risk | Complexity | Dependencies |
|----|----------------|--------|------|------------|--------------|
| LS-FND-001 | Project Scaffolding and Infrastructure | draft | low | M | None |
| LS-FND-002 | Search Infrastructure (FTS5) | draft | medium | M | LS-FND-001, LS-TB-003 |
| LS-FND-003 | Real-Time Polling Infrastructure | draft | low | S | LS-FND-001, LS-TB-001 |
| LS-FND-004 | Notification System | draft | low | M | LS-FND-001, LS-UM-001 |

### Module Charter References

| Module | Charter File | Live Spec Count | Dependencies |
|--------|-------------|-----------------|--------------|
| User Management | `charters/user-management.md` | 3 (LS-UM-001 through LS-UM-003) | LS-FND-001 |
| Task Boards | `charters/task-boards.md` | 4 (LS-TB-001 through LS-TB-004) | LS-FND-001, LS-UM-001, LS-UM-003 |

### Execution Order

1. **LS-FND-001 (Scaffolding):** Must be first. Creates the Next.js project, configures TypeScript, Tailwind, DaisyUI, Prisma, NextAuth, Docker, Vitest, and Playwright. Establishes the project structure and shared utilities (Prisma client, auth helpers, event emitter). All other specs depend on this.

2. **LS-UM-001 through LS-UM-003** (from User Management charter): Build on the scaffolded project.

3. **LS-TB-001 through LS-TB-004** (from Task Boards charter): Build on auth and project foundation.

4. **LS-FND-002 (Search):** Requires card and comment models to exist (LS-TB-003). Adds FTS5 index and search API route.

5. **LS-FND-003 (Real-Time Polling):** Requires at least one board route (LS-TB-001). Adds board version tracking and polling endpoint.

6. **LS-FND-004 (Notifications):** Requires auth (LS-UM-001). Can be built in parallel with Task Boards specs. Adds Notification model, event subscribers, and notification UI.

### Full Build Order

```
LS-FND-001 (Scaffolding)
    ├── LS-UM-001 (Auth Setup)
    │     ├── LS-UM-002 (User Profile)     ← parallel
    │     └── LS-UM-003 (Teams)            ← parallel
    │           └── LS-TB-001 (Board CRUD)
    │                 ├── LS-FND-003 (Polling)   ← parallel
    │                 └── LS-TB-002 (Lists)
    │                       └── LS-TB-003 (Cards)
    │                             ├── LS-FND-002 (Search)    ← parallel
    │                             └── LS-TB-004 (Comments)
    └── LS-FND-004 (Notifications)         ← parallel after LS-UM-001
```

---

## 5. Interface Contracts

### Domain Event Bus

All modules communicate through a lightweight in-process event emitter. Events are typed using the schemas defined in the module charters (User Management and Task Boards). The emitter lives at `src/shared/lib/events.ts`.

```typescript
import { EventEmitter } from "events";

type DomainEvent =
  | UserRegisteredEvent
  | TeamCreatedEvent
  | TeamMemberAddedEvent
  | TeamMemberRemovedEvent
  | TeamRoleChangedEvent
  | InvitationSentEvent
  | BoardCreatedEvent
  | ListCreatedEvent
  | ListReorderedEvent
  | CardCreatedEvent
  | CardMovedEvent
  | CardAssignedEvent
  | CardDueDateSetEvent
  | CardCommentedEvent;

const domainEvents = new EventEmitter();

export function publishEvent(event: DomainEvent): void {
  domainEvents.emit(event.type, event);
}

export function subscribeToEvent<T extends DomainEvent>(
  type: T["type"],
  handler: (event: T) => void
): void {
  domainEvents.on(type, handler);
}
```

### Shared Data Models (Foundation)

```prisma
// Added by LS-FND-004
model Notification {
  id        String   @id @default(cuid())
  type      String   // "card.assigned", "card.commented", "card.due_date_approaching"
  message   String
  read      Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  linkUrl   String?  // URL to navigate to when clicked
  createdAt DateTime @default(now())
}

// Added by LS-FND-002
// FTS5 virtual table created via raw SQL migration (not Prisma model)
// CREATE VIRTUAL TABLE search_index USING fts5(
//   entity_type,   -- "board", "card", "comment"
//   entity_id,
//   board_id,
//   content,
//   tokenize='porter'
// );
```

### API Boundaries (Foundation)

**Search:**
- `GET /api/search?q=term&boardId=optional` - Full-text search across boards, cards, and comments

**Notifications:**
- `GET /api/notifications` - List notifications for current user (paginated)
- `PATCH /api/notifications/:id` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

**Real-Time:**
- `GET /api/boards/:id/poll?version=hash` - Returns new board state if version differs, 304 if unchanged

### Cross-Module API Contracts

Modules communicate through three mechanisms within the monolith:

1. **Direct imports:** Shared utilities (Prisma client, auth helpers) are imported directly from `src/shared/lib/`.
2. **Shared database:** Both modules read and write to the same SQLite database via Prisma. User Management owns User, Team, Membership, and Invitation tables. Task Boards owns Board, List, Card, Label, Comment, and ActivityEntry tables. Task Boards references User via foreign keys (assigneeId, authorId, creatorId).
3. **Domain events:** Asynchronous cross-module communication. Task Boards emits events (card.assigned, card.commented) that Notifications subscribes to. User Management emits events (team.member_added) that Task Boards may consume for access control updates.

---

## 6. Governance and Risk

### Risk Classification

**Overall Risk Level:** low

| Risk Factor | Assessment | Mitigation |
|-------------|------------|------------|
| Architectural novelty | Low | Next.js + Prisma + SQLite is a proven combination |
| SQLite concurrency limits | Medium | SQLite handles concurrent reads well but serializes writes; sufficient for 50 concurrent users; upgrade path to PostgreSQL via Prisma migration if needed |
| FTS5 Prisma compatibility | Medium | Requires raw SQL for search queries; well-documented SQLite feature but bypasses Prisma type safety |
| Single container reliability | Low | Docker restart policy + volume persistence; acceptable for self-hosted target |
| Cross-module coordination | Low | Monolith with shared database; no distributed system concerns |

### HITL Gate Configuration

| Gate | Trigger | Approver |
|------|---------|----------|
| Architecture review | After LS-FND-001 scaffolding is complete | Developer |
| Spec approval | Before each Live Spec execution | Developer |
| Code review | After each Live Spec produces a PR | Developer |
| Integration test | After all module charters are complete | Developer |

### Rollback Strategy

Docker image versioning enables instant rollback by re-deploying the previous tag. SQLite database is backed up before each deployment (copy the database file). Prisma migrations are sequential and can be rolled back one at a time. In the worst case, restore the database file from backup and deploy the matching image version.

---

## 7. Acceptance Criteria (Feature Level)

### Business Outcome Validation

- [ ] A new user can register, create a team, create a board, add lists, and manage cards in a single session
- [ ] Multiple team members can view and interact with the same board with near-real-time updates
- [ ] Search returns relevant cards within 1 second for databases with up to 100K cards
- [ ] Users receive in-app notifications for assignments and mentions

### Integration Validation

- [ ] User Management and Task Boards modules share the same Prisma schema and database without conflicts
- [ ] Domain events emitted by one module are received by subscribers in other modules
- [ ] Auth session is available in all API routes and Server Components

### Performance and Scale Criteria

- [ ] Application starts in under 5 seconds in Docker
- [ ] Board page loads in under 500ms for boards with 500 cards
- [ ] Polling endpoint responds in under 50ms when board state has not changed (304)
- [ ] SQLite database handles 50 concurrent readers without degradation

### Infrastructure Validation

- [ ] `docker build` produces a working image
- [ ] `docker compose up` starts the application with persistent SQLite volume
- [ ] CI pipeline runs lint, type-check, unit tests, and E2E tests
- [ ] Prisma migrations apply cleanly on a fresh database
