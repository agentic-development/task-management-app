/**
 * Teams feature — public API.
 *
 * Re-exports the queries, actions, and types needed by pages
 * that manage teams.
 */

export { listTeams } from './queries/list-teams';
export { createTeam } from './actions/create-team';

export type { TeamSummary, TeamDetail, TeamMember, CreateTeamInput, CreateTeamResult, ListTeamsResult } from './types';
