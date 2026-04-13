import { prisma } from '@/shared/lib/prisma';
import type { ListUsersResult } from '../types';

/**
 * Fetch all users. Returns basic profile information (no team memberships).
 */
export async function listUsers(): Promise<ListUsersResult> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, users };
  } catch (error) {
    console.error('[list-users] Failed to list users:', error);
    return {
      success: false,
      users: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
