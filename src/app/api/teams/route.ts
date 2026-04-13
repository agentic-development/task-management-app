import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { listTeams, createTeam } from '@/features/teams';

/**
 * GET /api/teams
 *
 * Returns all teams with basic information.
 * Used by team management and team selection interfaces.
 */
export async function GET() {
  try {
    const result = await listTeams();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(result.teams);
  } catch (error) {
    console.error('[GET /api/teams] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/teams
 *
 * Creates a new team with the provided name and slug.
 * Returns the created team on success or a descriptive error on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'name is required and must be a string' },
        { status: 400 },
      );
    }

    if (!body.slug || typeof body.slug !== 'string') {
      return NextResponse.json(
        { error: 'slug is required and must be a string' },
        { status: 400 },
      );
    }

    const result = await createTeam({
      name: body.name,
      slug: body.slug,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result.team, { status: 201 });
  } catch (error) {
    console.error('[POST /api/teams] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
