import { prisma } from '@/shared/lib/prisma';
import type { ListTeamsResult } from '../types';

/**
 * Fetch all teams. Returns basic team information (no members).
 */
export async function listTeams(): Promise<ListTeamsResult> {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, teams };
  } catch (error) {
    console.error('[list-teams] Failed to list teams:', error);
    return {
      success: false,
      teams: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
