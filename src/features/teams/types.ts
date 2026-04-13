/**
 * Team feature types.
 *
 * These types mirror the Prisma Team and Membership models from the schema
 * but are decoupled from the ORM for use in client components and server actions.
 */

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDetail extends TeamSummary {
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

// ---- Server action payloads ----

export interface CreateTeamInput {
  name: string;
  slug: string;
}

export interface CreateTeamResult {
  success: boolean;
  team: TeamSummary | null;
  error?: string;
}

export interface ListTeamsResult {
  success: boolean;
  teams: TeamSummary[];
  error?: string;
}
