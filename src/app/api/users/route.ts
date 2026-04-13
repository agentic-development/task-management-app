import { NextResponse } from 'next/server';
import { listUsers } from '@/features/users';

/**
 * GET /api/users
 *
 * Returns all users with basic profile information.
 * Used by the `useUsers` React Query hook for user search and team management.
 */
export async function GET() {
  try {
    const result = await listUsers();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(result.users);
  } catch (error) {
    console.error('[GET /api/users] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
