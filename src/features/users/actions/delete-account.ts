'use server';

import { prisma } from '@/shared/lib/prisma';
import type { DeleteAccountResult } from '../types';

/**
 * Server Action: delete a user account.
 *
 * Cascading deletes are handled by the Prisma schema (onDelete: Cascade)
 * for related accounts, sessions, and memberships.
 */
export async function deleteAccount(
  userId: string,
): Promise<DeleteAccountResult> {
  try {
    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error('[delete-account] Failed to delete account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
