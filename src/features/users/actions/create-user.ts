'use server';

import { prisma } from '@/shared/lib/prisma';
import type { CreateUserInput, CreateUserResult } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server Action: create a new user.
 *
 * Validates input (name, email format, uniqueness) before persisting.
 * Returns the created user on success or a descriptive error on failure.
 */
export async function createUser(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  try {
    const { name, email, image } = input;

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, user: null, error: 'Name cannot be empty' };
    }

    // Validate email
    if (!email || email.trim().length === 0) {
      return { success: false, user: null, error: 'Email cannot be empty' };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { success: false, user: null, error: 'Invalid email format' };
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        user: null,
        error: 'A user with this email already exists',
      };
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        image: image ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('[create-user] Failed to create user:', error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
