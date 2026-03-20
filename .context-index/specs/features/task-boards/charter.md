---
id: task-boards
moduleSlug: task-boards
status: approved
updatedAt: 2026-03-20T23:43:27.522Z
decompositionMap: []
acceptanceCriteria: []
---
# Feature Charter: Task Boards

**Quarter:** 2026-Q1
**Status:** draft
**Author:** @dpavancini
**Created:** 2026-03-18
**Updated:** 2026-03-18

---

## 1. Business Intent

### Problem Statement

Teams need a shared, visual workspace to track tasks through defined workflow stages. Without one, work status lives in spreadsheets, chat threads, and individual memory, leading to missed deadlines, duplicated effort, and poor visibility.

### Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| Task completion rate | N/A (new product) | 80% of cards reach "Done" within 14 days | Card lifecycle tracking |
| Daily active usage | N/A | 70% of team members interact with boards daily | Activity log analysis |
| Board load time | N/A | Under 500ms for boards with up to 500 cards | Performance monitoring |

### Stakeholder Map

| Stakeholder | Role | Interest | Communication Cadence |
|-------------|------|----------|-----------------------|
| Team Members | Primary users | Organize and track their own tasks | On-demand |
| Team Leads | Power users | Monitor team progress, manage board structure | Weekly |
| Organization Admins | Administrators | Control access, manage teams and billing | Monthly |

---

## 2. Scope and Boundaries

### In Scope

- Create, read, update, and delete boards
- Create, read, update, and delete lists within boards
- Create, read, update, and delete cards within lists
- Reorder lists within a board (drag-and-drop positioning)
- Move cards between lists and reorder within a list
- Assign members to cards
- Set due dates on cards
- Add text descriptions and comments to cards
- Label cards with colored tags
- Archive and restore cards and lists
- Activity feed per board showing recent changes

### Out of Scope

- File attachments on cards (separate module)
- Automations and workflow rules (separate module)
- Calendar or timeline views (separate module)
- Recurring tasks
- Time tracking

### Adjacent Systems

| System | Interaction | Owner |
|--------|-------------|-------|
| User Management module | Consumes user identity via NextAuth session and team membership via Prisma queries on the Membership model | User Management charter |
| Notification service (future) | Publishes domain events that a future notification service can consume | Not yet chartered |

---

## 3. Architectural Vision

### Bounded Contexts

**Board Context:** Owns Board, List, and board-level settings. A Board belongs to a Team (from the User Management context). Access control checks team membership before allowing board operations.

**Card Context:** Owns Card, Label, Comment, and Activity Entry. Cards live within Lists. Card assignment references User IDs from the Identity context but does not own user data.

Both contexts share a single Prisma schema and SQLite database. The boundary is logical (feature-based file structure) rather than physical (separate services).

### System Boundaries

The Task Boards module operates as Next.js API routes and Server Components:

- **Board API routes** live under `/api/boards/` (REST)
- **Card API routes** live under `/api/boards/:boardId/cards/` (REST)
- **Frontend pages** live under `src/features/boards/` (feature-based structure)
- **Shared components** (card modal, drag-and-drop, label picker) live under `src/features/boards/components/`

Data flows:
- Server Components fetch board data via Prisma on initial page load
- Client Components use React Query to manage card mutations with optimistic updates
- Drag-and-drop reordering sends position updates to API routes, which update Prisma and return the reconciled state
- Activity entries are created server-side on every mutation via Prisma middleware or explicit service calls

### Key Architectural Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Fractional indexing for ordering | Allows inserting items between two positions without reindexing all siblings; better for concurrent drag-and-drop | Integer positions (requires reindexing on every move), linked list (complex queries for bulk reads) |
| Optimistic updates via React Query | Users see drag-and-drop results instantly; reconciliation on server response prevents stale UI | Server-first rendering (laggy drag-and-drop), WebSocket push (adds infrastructure complexity for initial version) |
| Single SQLite database for all contexts | Simplifies development and deployment; transactional consistency across boards and users | Separate databases per context (unnecessary complexity at this scale) |
| DaisyUI for board UI components | Provides pre-built card, badge, and modal components that match the board metaphor; reduces custom CSS | Custom Tailwind only (slower to build), Material UI (heavier bundle, less flexible) |
| Prisma middleware for activity logging | Centralized audit trail without scattering logging calls across every mutation handler | Manual logging in each route (error-prone, easy to forget), database triggers (SQLite trigger support is limited) |

---

## 4. Decomposition Map

| ID | Live Spec Title | Status | Risk | Complexity | Dependencies |
|----|----------------|--------|------|------------|--------------|
| LS-TB-001 | Board CRUD and Visibility | draft | low | M | LS-UM-001 (Auth Setup) |
| LS-TB-002 | List Management and Ordering | draft | medium | M | LS-TB-001 |
| LS-TB-003 | Card Management (CRUD, Assignment, Due Dates, Labels) | draft | medium | L | LS-TB-002 |
| LS-TB-004 | Comments and Activity Feed | draft | low | M | LS-TB-003 |

### Execution Order

1. **LS-TB-001 (Board CRUD):** Create the Board model, API routes, and board list/detail pages. Implements board creation, visibility settings, and team-based access control by querying the Membership model. Requires LS-UM-001 to be complete (needs auth and team models).

2. **LS-TB-002 (List Management):** Add the List model with fractional indexing. Implements list CRUD and drag-and-drop reordering within a board. Requires LS-TB-001 (boards must exist).

3. **LS-TB-003 (Card Management):** The largest spec. Adds Card, Label, and the card-label join table. Implements card CRUD, moving cards between lists, assigning members, setting due dates, and labeling. Includes the drag-and-drop card interface with optimistic updates via React Query.

4. **LS-TB-004 (Comments and Activity):** Adds Comment and ActivityEntry models. Implements the comment thread UI on cards and the board-level activity feed. Adds Prisma middleware for automatic activity logging.

Specs must be built sequentially due to entity dependencies (boards contain lists contain cards).

---

## 5. Interface Contracts

### Event Schemas

```typescript
interface BoardCreatedEvent {
  type: "board.created";
  payload: {
    boardId: string;
    name: string;
    teamId: string;
    creatorId: string;
    timestamp: Date;
  };
}

interface ListCreatedEvent {
  type: "list.created";
  payload: {
    listId: string;
    boardId: string;
    name: string;
    position: string; // fractional index
    timestamp: Date;
  };
}

interface ListReorderedEvent {
  type: "list.reordered";
  payload: {
    listId: string;
    boardId: string;
    newPosition: string;
    timestamp: Date;
  };
}

interface CardCreatedEvent {
  type: "card.created";
  payload: {
    cardId: string;
    listId: string;
    boardId: string;
    title: string;
    creatorId: string;
    timestamp: Date;
  };
}

interface CardMovedEvent {
  type: "card.moved";
  payload: {
    cardId: string;
    fromListId: string;
    toListId: string;
    newPosition: string;
    movedById: string;
    timestamp: Date;
  };
}

interface CardAssignedEvent {
  type: "card.assigned";
  payload: {
    cardId: string;
    assigneeId: string;
    assignedById: string;
    timestamp: Date;
  };
}

interface CardDueDateSetEvent {
  type: "card.due_date_set";
  payload: {
    cardId: string;
    dueDate: Date | null;
    timestamp: Date;
  };
}

interface CardCommentedEvent {
  type: "card.commented";
  payload: {
    cardId: string;
    commentId: string;
    authorId: string;
    timestamp: Date;
  };
}
```

### API Boundaries

**Boards:**
- `POST /api/boards` - Create a board (requires team membership)
- `GET /api/boards` - List boards for the current user (across all teams)
- `GET /api/boards/:id` - Get board with all lists and cards
- `PATCH /api/boards/:id` - Update board name, description, visibility
- `DELETE /api/boards/:id` - Archive a board (soft delete)
- `POST /api/boards/:id/restore` - Restore an archived board

**Lists:**
- `POST /api/boards/:boardId/lists` - Create a list
- `PATCH /api/boards/:boardId/lists/:id` - Update list name or position
- `DELETE /api/boards/:boardId/lists/:id` - Archive a list

**Cards:**
- `POST /api/boards/:boardId/cards` - Create a card in a list (listId in body)
- `GET /api/boards/:boardId/cards/:id` - Get card details
- `PATCH /api/boards/:boardId/cards/:id` - Update card fields (title, description, dueDate, assigneeId, listId, position)
- `DELETE /api/boards/:boardId/cards/:id` - Archive a card

**Labels:**
- `POST /api/boards/:boardId/labels` - Create a label
- `PATCH /api/boards/:boardId/labels/:id` - Update label name or color
- `DELETE /api/boards/:boardId/labels/:id` - Delete a label
- `POST /api/boards/:boardId/cards/:cardId/labels` - Attach a label to a card
- `DELETE /api/boards/:boardId/cards/:cardId/labels/:labelId` - Remove a label from a card

**Comments:**
- `POST /api/boards/:boardId/cards/:cardId/comments` - Add a comment
- `PATCH /api/boards/:boardId/cards/:cardId/comments/:id` - Edit a comment
- `DELETE /api/boards/:boardId/cards/:cardId/comments/:id` - Delete a comment

**Activity:**
- `GET /api/boards/:boardId/activity` - Get board activity feed (paginated)
- `GET /api/boards/:boardId/cards/:cardId/activity` - Get card activity (paginated)

### Shared Data Models

```prisma
model Board {
  id          String   @id @default(cuid())
  name        String
  description String?
  visibility  String   @default("team") // "private" | "team"
  archived    Boolean  @default(false)
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId      String
  lists       List[]
  labels      Label[]
  activities  ActivityEntry[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model List {
  id       String  @id @default(cuid())
  name     String
  position String  // fractional index for ordering
  archived Boolean @default(false)
  board    Board   @relation(fields: [boardId], references: [id], onDelete: Cascade)
  boardId  String
  cards    Card[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Card {
  id          String    @id @default(cuid())
  title       String
  description String?
  position    String    // fractional index for ordering
  dueDate     DateTime?
  archived    Boolean   @default(false)
  list        List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  listId      String
  assignee    User?     @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  assigneeId  String?
  labels      CardLabel[]
  comments    Comment[]
  activities  ActivityEntry[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Label {
  id      String      @id @default(cuid())
  name    String
  color   String      // hex color code
  board   Board       @relation(fields: [boardId], references: [id], onDelete: Cascade)
  boardId String
  cards   CardLabel[]
}

model CardLabel {
  card    Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId  String
  label   Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
  labelId String

  @@id([cardId, labelId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ActivityEntry {
  id        String   @id @default(cuid())
  action    String   // "card.created", "card.moved", etc.
  actorId   String
  targetType String  // "board", "list", "card", "comment"
  targetId  String
  metadata  String?  // JSON string with action-specific data
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  boardId   String
  card      Card?    @relation(fields: [cardId], references: [id], onDelete: SetNull)
  cardId    String?
  createdAt DateTime @default(now())
}
```

---

## 6. Governance and Risk

### Risk Classification

**Overall Risk Level:** medium

| Risk Factor | Assessment | Mitigation |
|-------------|------------|------------|
| Architectural novelty | Low | Next.js API routes + Prisma is a standard pattern |
| Drag-and-drop complexity | Medium | Fractional indexing is well-documented but requires careful implementation to avoid ordering bugs |
| Optimistic update consistency | Medium | React Query mutation rollback on server error; use server state as source of truth |
| Data sensitivity | Low | Task data is not personally identifiable; standard access control is sufficient |
| Business impact of failure | Medium | Board unavailability blocks team productivity |

### HITL Gate Configuration

| Gate | Trigger | Approver |
|------|---------|----------|
| Spec approval | Before agent execution begins | Developer |
| Code review | After agent produces PR | Developer |
| UX review | After drag-and-drop implementation (LS-TB-003) | Developer |

### Rollback Strategy

All database changes use Prisma migrations with explicit migration files. Each Live Spec produces an isolated migration that can be reverted via `prisma migrate` rollback. Frontend changes deploy as Docker image versions; rollback by re-deploying the previous image tag. Feature flags are not needed at this scale; the board module either exists or does not.

---

## 7. Acceptance Criteria (Feature Level)

### Business Outcome Validation

- [ ] A user can create a board, add lists, create cards, and move cards between lists
- [ ] A team member can be assigned to a card and sees the assignment reflected in the board view
- [ ] Board activity feed accurately records all card movements, assignments, and comments

### Integration Validation

- [ ] Board access control correctly checks team membership from the User Management module
- [ ] Only team members with "member" or "admin" role can create and modify cards
- [ ] Users with "viewer" role can view boards but cannot modify content
- [ ] Domain events are emitted for all card and board mutations

### Performance and Scale Criteria

- [ ] Board with 500 cards loads in under 500ms (server-side render)
- [ ] Drag-and-drop card move reflects in UI within 100ms (optimistic update)
- [ ] Activity feed paginates correctly for boards with 10,000+ entries

