'use server';

import { prisma } from '@/shared/lib/prisma';
import type { CreateTeamInput, CreateTeamResult } from '../types';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Server Action: create a new team.
 *
 * Validates input (name, slug format, uniqueness) before persisting.
 * Returns the created team on success or a descriptive error on failure.
 */
export async function createTeam(
  input: CreateTeamInput,
): Promise<CreateTeamResult> {
  try {
    const { name, slug } = input;

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, team: null, error: 'Team name cannot be empty' };
    }

    // Validate slug
    if (!slug || slug.trim().length === 0) {
      return { success: false, team: null, error: 'Slug cannot be empty' };
    }

    // Normalize slug to lowercase before validation
    const normalizedSlug = slug.trim().toLowerCase();

    if (!SLUG_REGEX.test(normalizedSlug)) {
      return {
        success: false,
        team: null,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      };
    }

    // Check for duplicate slug
    const existing = await prisma.team.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        team: null,
        error: 'A team with this slug already exists',
      };
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug: normalizedSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, team };
  } catch (error) {
    console.error('[create-team] Failed to create team:', error);
    return {
      success: false,
      team: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
