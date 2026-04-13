'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserWithTeams, UserProfile } from '../types';

// ---- Query keys ----

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
  me: ['users', 'me'] as const,
};

// ---- Fetch functions ----

async function fetchCurrentUser(): Promise<UserWithTeams> {
  const res = await fetch('/api/users/me');
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

async function fetchUsers(): Promise<UserProfile[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// ---- Hooks ----

/**
 * Fetch the currently authenticated user's profile and team memberships.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: 30_000, // Profile data changes infrequently
  });
}

/**
 * Fetch all users (for team management / user search).
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: fetchUsers,
    staleTime: 10_000,
  });
}
