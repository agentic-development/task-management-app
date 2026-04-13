/**
 * Team feature types.
 *
 * These types mirror the Prisma Team and Membership models
 * but are decoupled from the ORM for use in client components and server actions.
 */

export interface TeamProfile {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithMembers extends TeamProfile {
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  role: 'admin' | 'member' | 'viewer';
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
  team: TeamProfile | null;
  error?: string;
}

export interface ListTeamsResult {
  success: boolean;
  teams: TeamProfile[];
  error?: string;
}
