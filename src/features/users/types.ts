/**
 * User feature types.
 *
 * These types mirror the Prisma User model from the charter's shared data models
 * but are decoupled from the ORM for use in client components and server actions.
 */

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithTeams extends UserProfile {
  memberships: UserMembership[];
}

export interface UserMembership {
  id: string;
  role: 'admin' | 'member' | 'viewer';
  team: {
    id: string;
    name: string;
    slug: string;
  };
}

// ---- Server action payloads ----

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  image?: string | null;
}

export interface UpdateProfileResult {
  success: boolean;
  user: UserProfile | null;
  error?: string;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

export interface GetUserResult {
  success: boolean;
  user: UserWithTeams | null;
  error?: string;
}

export interface ListUsersResult {
  success: boolean;
  users: UserProfile[];
  error?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  image?: string | null;
}

export interface CreateUserResult {
  success: boolean;
  user: UserProfile | null;
  error?: string;
}
