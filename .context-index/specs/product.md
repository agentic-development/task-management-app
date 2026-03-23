# Product Charter: Task Management App

<!-- Condensed from charters/task-management-app.md. See the full charter for detailed contracts and schemas. -->

## Vision

Collaborative, Trello-like task management app. Self-hosted Next.js monolith with SQLite persistence, deployed as a Docker container.

## Problem

Teams need a visual workspace to organize work using boards, lists, and cards. Spreadsheets, chat threads, and email lead to missed deadlines, duplicated effort, and poor visibility.

## Success Metrics

| Metric | Target |
|--------|--------|
| Weekly active teams | 10 teams within first month |
| Availability | 99.9% during business hours |
| Board load time | < 500ms for 500 cards |
| Concurrent users per board | 50 simultaneous |

## Module Map

| Module | Charter | Live Specs | Owner |
|--------|---------|------------|-------|
| Foundation | `charters/task-management-app.md` | LS-FND-001 through LS-FND-004 | Product |
| User Management | `charters/user-management.md` | LS-UM-001 through LS-UM-003 | Identity + Team |
| Task Boards | `charters/task-boards.md` | LS-TB-001 through LS-TB-004 | Board + Card |

## Bounded Contexts

| Context | Entities | Owner |
|---------|----------|-------|
| Identity | User, Account, Session | User Management |
| Team | Team, Membership, Invitation | User Management |
| Board | Board, List, Label | Task Boards |
| Card | Card, CardLabel, Comment, ActivityEntry | Task Boards |
| Infrastructure | Notifications, Search Index | Foundation |

## Cross-Cutting Concerns

- **Activity logging:** Prisma middleware on all tracked mutations
- **Real-time updates:** React Query polling (3-5s), upgrade path to SSE
- **Search:** SQLite FTS5 via `prisma.$queryRaw`
- **Notifications:** Domain events → in-app notification records → polling delivery
- **Cross-module communication:** Typed in-process EventEmitter

## Build Order

```
LS-FND-001 (Scaffolding)           ← must be first
  ├── LS-UM-001 (Auth)
  │     ├── LS-UM-002 (Profiles)        ← parallel
  │     ├── LS-UM-003 (Teams)           ← parallel
  │     │     └── LS-TB-001 (Board CRUD)
  │     │           ├── LS-FND-003 (Polling)    ← parallel
  │     │           └── LS-TB-002 (Lists)
  │     │                 └── LS-TB-003 (Cards)
  │     │                       ├── LS-FND-002 (Search)     ← parallel
  │     │                       └── LS-TB-004 (Comments)
  │     └── LS-FND-004 (Notifications)  ← parallel after auth
```

## Out of Scope (v1)

- File attachments
- Workflow automation rules
- Calendar/timeline views
- Billing and subscriptions
- SSO/SAML
- Email notifications (in-app only)
