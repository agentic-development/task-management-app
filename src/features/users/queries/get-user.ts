import { prisma } from '@/shared/lib/prisma';
import type { GetUserResult } from '../types';

/**
 * Fetch a single user by ID, including their team memberships.
 */
export async function getUser(userId: string): Promise<GetUserResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, user: null, error: 'User not found' };
    }

    return {
      success: true,
      user: user as GetUserResult['user'],
    };
  } catch (error) {
    console.error('[get-user] Failed to fetch user:', error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
