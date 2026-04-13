/**
 * Teams feature — public API.
 *
 * Re-exports the queries, actions, and types needed by pages
 * that manage teams and team memberships.
 */

export { listTeams } from './queries/list-teams';
export { createTeam } from './actions/create-team';

export type {
  TeamProfile,
  TeamWithMembers,
  TeamMember,
  CreateTeamInput,
  CreateTeamResult,
  ListTeamsResult,
} from './types';
