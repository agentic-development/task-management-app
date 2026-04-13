'use server';

import { prisma } from '@/shared/lib/prisma';
import type { UpdateProfileInput, UpdateProfileResult } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server Action: update a user's profile fields (name, email, image).
 *
 * Validates input before persisting. Checks for email uniqueness when
 * the email is being changed. Returns the updated user on success
 * or a descriptive error message on failure.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  try {
    const { name, email, image } = input;

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return { success: false, user: null, error: 'User not found' };
    }

    // Validate name if provided
    if (name !== undefined && name.trim().length === 0) {
      return { success: false, user: null, error: 'Name cannot be empty' };
    }

    // Validate and check email uniqueness if provided
    if (email !== undefined) {
      if (!EMAIL_REGEX.test(email)) {
        return { success: false, user: null, error: 'Invalid email format' };
      }

      // Check for duplicate email (excluding current user)
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          user: null,
          error: 'A user with this email already exists',
        };
      }
    }

    // Build the update payload — only include fields that were explicitly provided
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (image !== undefined) updateData.image = image;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('[update-profile] Failed to update profile:', error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
