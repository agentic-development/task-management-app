import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/features/users/queries/get-user';
import { updateProfile } from '@/features/users/actions/update-profile';
import { deleteAccount } from '@/features/users/actions/delete-account';

// TODO: Replace with actual session extraction once NextAuth is set up (LS-UM-001)
async function getCurrentUserId(_request: NextRequest): Promise<string | null> {
  // Placeholder: In production, extract from NextAuth session via getServerSession()
  const userId = _request.headers.get('x-user-id');
  return userId;
}

/**
 * GET /api/users/me
 *
 * Returns the currently authenticated user's profile and team memberships.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const result = await getUser(userId);

    if (!result.success) {
      const status = result.error === 'User not found' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.user);
  } catch (error) {
    console.error('[GET /api/users/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/users/me
 *
 * Update the current user's profile (name, email, image).
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = await updateProfile(userId, body);

    if (!result.success) {
      const status =
        result.error === 'User not found' ? 404
        : result.error?.includes('already exists') ? 409
        : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.user);
  } catch (error) {
    console.error('[PATCH /api/users/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/me
 *
 * Delete the current user's account. Cascading deletes handle related data.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const result = await deleteAccount(userId);

    if (!result.success) {
      const status = result.error === 'User not found' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/users/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
