# Feature Charter: User Management

**Quarter:** 2026-Q1
**Status:** draft
**Author:** @dpavancini
**Created:** 2026-03-18
**Updated:** 2026-03-18

---

## 1. Business Intent

### Problem Statement

A collaborative application requires identity management, access control, and team organization. Without structured user management, there is no way to control who sees what, track who did what, or organize users into meaningful groups.

### Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| Signup-to-first-board time | N/A (new product) | Under 2 minutes | User journey tracking |
| Authentication success rate | N/A | 99.5% of login attempts succeed on first try | Auth logs |
| Permission violation rate | N/A | Zero unauthorized access incidents | Access audit logs |

### Stakeholder Map

| Stakeholder | Role | Interest | Communication Cadence |
|-------------|------|----------|-----------------------|
| End Users | Account holders | Sign up, log in, manage profile | On-demand |
| Team Leads | Team managers | Invite members, assign roles | Weekly |
| Organization Admins | System administrators | Manage organization settings, audit | Monthly |

---

## 2. Scope and Boundaries

### In Scope

- User registration and authentication via NextAuth/Auth.js
- User profile management (name, email, avatar)
- Team creation and membership management
- Role-based access control (admin, member, viewer)
- Invitation flow (invite by email, accept/decline)
- Session management (login, logout, session refresh via NextAuth)
- Password reset flow

### Out of Scope

- Single sign-on (SSO) and SAML integration
- Multi-factor authentication
- Billing and subscription management
- User analytics and engagement tracking

### Adjacent Systems

| System | Interaction | Owner |
|--------|-------------|-------|
| Task Boards module | Publishes user identity and team membership; boards consume these for access control | Task Boards charter |
| Email service (external) | Sends invitation emails and password reset links | Infrastructure |

---

## 3. Architectural Vision

### Bounded Contexts

**Identity Context:** Owns User, Session, and credential management. Implemented via NextAuth/Auth.js with the Prisma adapter for session persistence in SQLite. This context is the sole authority for "who is this user?" questions.

**Team Context:** Owns Team, Membership, and Invitation entities. Exposed through Next.js API routes under `/api/teams/`. Consumes user identity from the Identity Context but does not manage credentials.

### System Boundaries

The User Management module operates as a set of Next.js API routes and Server Components:

- **Auth routes** are handled by NextAuth at `/api/auth/[...nextauth]`
- **Team API routes** live under `/api/teams/` (REST)
- **Profile API routes** live under `/api/users/` (REST)
- **Frontend pages** live under `src/features/auth/` and `src/features/teams/` (feature-based structure)

Data flows:
- NextAuth manages the session lifecycle (create, refresh, invalidate)
- API routes read the session via `getServerSession()` to authorize requests
- Team membership changes produce domain events consumed by the Task Boards module

### Key Architectural Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| NextAuth with Prisma adapter | Built-in session management, credential and OAuth providers, direct SQLite integration via Prisma | Custom JWT auth (more work, less battle-tested), Clerk (adds external dependency and cost) |
| Session-based auth (not JWT) | Server-side sessions are simpler to revoke and do not require token refresh logic on the client | JWT (stateless but harder to revoke, token size grows with claims) |
| SQLite for session storage | Single-file database simplifies development and Docker deployment; sufficient for target scale | Redis (adds infrastructure), PostgreSQL (overkill for initial scale) |
| Feature-based file structure | Co-locates related components, API routes, and types; scales better than layer-based as modules grow | Layer-based (separates by concern but scatters related code) |

---

## 4. Decomposition Map

| ID | Live Spec Title | Status | Risk | Complexity | Dependencies |
|----|----------------|--------|------|------------|--------------|
| LS-UM-001 | Auth Setup (NextAuth + Prisma + SQLite) | draft | low | M | None |
| LS-UM-002 | User Profile Management | draft | low | S | LS-UM-001 |
| LS-UM-003 | Team and Membership Management | draft | medium | L | LS-UM-001 |

### Execution Order

1. **LS-UM-001 (Auth Setup):** Foundation spec. Sets up NextAuth with the Prisma adapter, configures SQLite database, implements registration, login, logout, and password reset. All other specs depend on this.
2. **LS-UM-002 (User Profile):** Can start after LS-UM-001. Adds profile page, avatar upload, email change flow.
3. **LS-UM-003 (Teams):** Can start after LS-UM-001. Implements team CRUD, invitation flow, role management. This is the largest spec due to the invitation lifecycle and permission checks.

LS-UM-002 and LS-UM-003 can run in parallel once LS-UM-001 is complete.

---

## 5. Interface Contracts

### Event Schemas

```typescript
interface UserRegisteredEvent {
  type: "user.registered";
  payload: {
    userId: string;
    email: string;
    timestamp: Date;
  };
}

interface TeamCreatedEvent {
  type: "team.created";
  payload: {
    teamId: string;
    name: string;
    creatorId: string;
    timestamp: Date;
  };
}

interface TeamMemberAddedEvent {
  type: "team.member_added";
  payload: {
    teamId: string;
    userId: string;
    role: "admin" | "member" | "viewer";
    timestamp: Date;
  };
}

interface TeamMemberRemovedEvent {
  type: "team.member_removed";
  payload: {
    teamId: string;
    userId: string;
    timestamp: Date;
  };
}

interface TeamRoleChangedEvent {
  type: "team.role_changed";
  payload: {
    teamId: string;
    userId: string;
    oldRole: "admin" | "member" | "viewer";
    newRole: "admin" | "member" | "viewer";
    timestamp: Date;
  };
}

interface InvitationSentEvent {
  type: "invitation.sent";
  payload: {
    invitationId: string;
    teamId: string;
    email: string;
    role: "admin" | "member" | "viewer";
    expiresAt: Date;
    timestamp: Date;
  };
}
```

### API Boundaries

**Auth (managed by NextAuth):**
- `POST /api/auth/signin` - Initiate sign-in
- `POST /api/auth/signout` - End session
- `GET /api/auth/session` - Get current session

**Users:**
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile (name, email, avatar)
- `DELETE /api/users/me` - Delete account

**Teams:**
- `POST /api/teams` - Create a team
- `GET /api/teams` - List user teams
- `GET /api/teams/:id` - Get team details and members
- `PATCH /api/teams/:id` - Update team settings
- `DELETE /api/teams/:id` - Delete team (admin only)

**Memberships:**
- `POST /api/teams/:id/invitations` - Invite a member by email
- `POST /api/invitations/:token/accept` - Accept an invitation
- `DELETE /api/teams/:id/members/:userId` - Remove a member
- `PATCH /api/teams/:id/members/:userId` - Change member role

### Shared Data Models

```prisma
model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  memberships   Membership[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Team {
  id          String       @id @default(cuid())
  name        String
  description String?
  memberships Membership[]
  invitations Invitation[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Membership {
  id     String @id @default(cuid())
  role   String @default("member") // "admin" | "member" | "viewer"
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String
  team   Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId String
  joinedAt DateTime @default(now())

  @@unique([userId, teamId])
}

model Invitation {
  id        String   @id @default(cuid())
  email     String
  role      String   @default("member")
  token     String   @unique @default(cuid())
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## 6. Governance and Risk

### Risk Classification

**Overall Risk Level:** low

| Risk Factor | Assessment | Mitigation |
|-------------|------------|------------|
| Architectural novelty | Low | NextAuth + Prisma is a well-documented, widely adopted combination |
| Data sensitivity | Medium | User credentials and emails require proper hashing and access control |
| Integration complexity | Low | NextAuth adapter handles Prisma integration; minimal custom wiring |
| Business impact of failure | Medium | Auth failures block all application usage |

### HITL Gate Configuration

| Gate | Trigger | Approver |
|------|---------|----------|
| Spec approval | Before agent execution begins | Developer |
| Code review | After agent produces PR | Developer |
| Security review | Before production release of auth flows | Developer |

### Rollback Strategy

NextAuth configuration changes are code-level (no database migrations for auth config). For Prisma schema changes, use `prisma migrate` with explicit migration files that can be reverted. Docker deployment supports blue-green rollback by keeping the previous image version tagged and available.

---

## 7. Acceptance Criteria (Feature Level)

### Business Outcome Validation

- [ ] A new user can register, log in, and reach the dashboard in under 2 minutes
- [ ] A team admin can invite a member by email and the member can accept and access team boards
- [ ] A viewer role cannot create or modify boards, cards, or lists

### Integration Validation

- [ ] NextAuth session is accessible in Server Components via `getServerSession()`
- [ ] Team membership is queryable by the Task Boards module for access control
- [ ] Domain events are emitted on team membership changes

### Performance and Scale Criteria

- [ ] Login flow completes in under 1 second
- [ ] Team membership queries return in under 100ms for teams with up to 100 members
