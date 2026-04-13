/**
 * Users feature — public API.
 *
 * Re-exports the queries, actions, hooks, and types needed by pages
 * that manage user profiles and accounts.
 */

export { getUser } from './queries/get-user';
export { listUsers } from './queries/list-users';
export { useCurrentUser, useUsers, userKeys } from './queries/use-user';
export { createUser } from './actions/create-user';
export { updateProfile } from './actions/update-profile';
export { deleteAccount } from './actions/delete-account';

export type {
  UserProfile,
  UserWithTeams,
  UserMembership,
  UpdateProfileInput,
  UpdateProfileResult,
  DeleteAccountResult,
  GetUserResult,
  ListUsersResult,
  CreateUserInput,
  CreateUserResult,
} from './types';
